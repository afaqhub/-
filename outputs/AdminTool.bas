Attribute VB_Name = "PlanAdmin"
'=========================================================================
' Teaching Plan - Admin Tool  (version 3.0)
'
' HOW TO INSTALL (one time):
'   1. Create a new empty Excel file and save it as  AdminTool.xlsm
'      in the SAME folder as the teachers' plan file.
'   2. Press Alt+F11, then File > Import File... and choose this .bas file.
'   3. Close the editor, press Alt+F8, choose "Setup" and click Run.
'      The control panel (buttons, lists, help) is built automatically.
'
' The code is English-only on purpose. Every Arabic text shown to the user
' is stored as Unicode hex codes in function T() at the bottom of the module.
' The teachers' file contains no macros; this tool opens it, works, saves.
'=========================================================================
Option Explicit

Private Const APP_VER As String = "3.0"

' ---- teachers file: columns of the class table (named range DB_Classes)
Private Const C_NAME As Long = 1
Private Const C_TYPE As Long = 2
Private Const C_TEACHER As Long = 3
Private Const C_COURSE As Long = 4
Private Const C_PART As Long = 5
Private Const C_START As Long = 6
Private Const C_END As Long = 7
Private Const C_DAY1 As Long = 8
Private Const C_DAY3 As Long = 10
Private Const C_NEXT As Long = 14
Private Const C_TRANS As Long = 15
Private Const C_STATUS As Long = 16

' ---- lessons sheet layout
Private Const L_R0 As Long = 8
Private Const L_R1 As Long = 67
Private Const L_TOPIC As Long = 4
Private Const L_DATE As Long = 6
Private Const L_EXEC As Long = 7

' ---- quran sheet layout
Private Const Q_C0 As Long = 5
Private Const Q_C1 As Long = 44
Private Const Q_RLABEL As Long = 7
Private Const Q_RDATE As Long = 8
Private Const Q_REXEC As Long = 9
Private Const Q_S0 As Long = 11
Private Const Q_S1 As Long = 70
Private Const Q_ID As Long = 2
Private Const Q_SNAME As Long = 3
Private Const Q_AVG As Long = 4

' ---- admin workbook
Private Const SH_PANEL As String = "Panel"
Private Const SH_REPORT As String = "Report"
Private Const SH_LOG As String = "Log"
Private Const SH_LISTS As String = "Lists"
Private Const SH_HELP As String = "Help"
Private Const LR0 As Long = 34         ' first data row of the class list on Panel
Private Const LC As Long = 2           ' first column of the class list on Panel (B)
Private Const O_CLS As Long = 1
Private Const O_TEA As Long = 2
Private Const O_TYP As Long = 3
Private Const O_PRT As Long = 4
Private Const O_STA As Long = 5
Private Const O_SHT As Long = 6
Private Const MAXLIST As Long = 600

Private mFSO As Object
Private mRep As Worksheet
Private mRepRow As Long
Private mErr As Long
Private mWarn As Long
Private mHolF() As Date
Private mHolT() As Date
Private mHolN As Long
Private mD0 As Date
Private mLim As Date
Private mDays(1 To 7) As Boolean

'=========================================================================
' small helpers
'=========================================================================
Private Function FSO() As Object
    If mFSO Is Nothing Then Set mFSO = CreateObject("Scripting.FileSystemObject")
    Set FSO = mFSO
End Function

Private Function CK() As String
    CK = ChrW(&H2713)
End Function

Private Function Txt(ByVal v As Variant) As String
    If IsError(v) Then
        Txt = ""
    ElseIf IsEmpty(v) Or IsNull(v) Then
        Txt = ""
    Else
        Txt = Trim$(CStr(v))
    End If
End Function

Private Function HasDateVal(ByVal v As Variant) As Boolean
    ' a cell counts as "has a date" if it holds a date, a positive serial number,
    ' or text that Excel can read as a date. Recorded values are never overwritten.
    If IsError(v) Then Exit Function
    If IsEmpty(v) Then Exit Function
    If Len(Txt(v)) = 0 Then Exit Function
    If VarType(v) = vbDate Then
        HasDateVal = True
    ElseIf IsNumeric(v) Then
        HasDateVal = (CDbl(v) > 0)
    Else
        HasDateVal = IsDate(v)
    End If
End Function

Private Function CfgCell(ByVal nm As String) As Range
    Set CfgCell = ThisWorkbook.Names(nm).RefersToRange
End Function

Private Function HasName(wb As Workbook, ByVal nm As String) As Boolean
    Dim o As Object
    On Error Resume Next
    Set o = wb.Names(nm)
    HasName = (Err.Number = 0)
    Err.Clear
    On Error GoTo 0
End Function

Private Function LV(wb As Workbook, ByVal nm As String, ByVal i As Long) As String
    LV = Txt(wb.Names(nm).RefersToRange.Cells(i, 1).Value)
End Function

Private Function FindSheet(wb As Workbook, ByVal nm As String) As Worksheet
    Dim ws As Worksheet
    For Each ws In wb.Worksheets
        If StrComp(ws.Name, nm, vbTextCompare) = 0 Then
            Set FindSheet = ws
            Exit Function
        End If
    Next ws
End Function

Private Function FindRow(db As Range, ByVal nm As String) As Long
    Dim r As Long
    For r = 2 To db.Rows.Count
        If StrComp(Txt(db.Cells(r, C_NAME).Value), nm, vbTextCompare) = 0 Then
            FindRow = r
            Exit Function
        End If
    Next r
End Function

Private Function FirstEmptyRow(db As Range) As Long
    Dim r As Long
    For r = 2 To db.Rows.Count
        If Len(Txt(db.Cells(r, C_NAME).Value)) = 0 Then
            FirstEmptyRow = r
            Exit Function
        End If
    Next r
End Function

Private Function ValidSheetName(ByVal nm As String) As Boolean
    Dim ch As Variant
    ValidSheetName = (Len(nm) > 0 And Len(nm) <= 31)
    For Each ch In Array("[", "]", "/", "\", "?", "*", ":")
        If InStr(nm, ch) > 0 Then ValidSheetName = False
    Next ch
    If Left$(nm, 1) = "'" Or Right$(nm, 1) = "'" Then ValidSheetName = False
End Function

Private Function IsActiveStatus(ByVal st As String, ByVal sAct As String) As Boolean
    IsActiveStatus = (Len(st) = 0 Or StrComp(st, sAct, vbTextCompare) = 0)
End Function

Private Sub BeginWork()
    Application.ScreenUpdating = False
    Application.DisplayAlerts = False
    Application.EnableEvents = False
End Sub

Private Sub EndWork()
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True
    Application.EnableEvents = True
    Application.StatusBar = False
End Sub

Private Sub Unprot(ws As Worksheet)
    On Error Resume Next
    ws.Unprotect
    On Error GoTo 0
End Sub

Private Sub Prot(ws As Worksheet)
    On Error Resume Next
    ws.Protect DrawingObjects:=False, Contents:=True, Scenarios:=False, _
               AllowFormattingColumns:=True, AllowFormattingRows:=True
    On Error GoTo 0
End Sub

Private Function ShortList(c As Collection) As String
    Dim i As Long, s As String
    For i = 1 To c.Count
        If i > 25 Then
            s = s & vbLf & "  " & T("andMore")
            Exit For
        End If
        s = s & vbLf & "  - " & c(i)
    Next i
    ShortList = s
End Function

'=========================================================================
' teachers file: locate, open, close, backup
'=========================================================================
Private Function TargetPath() As String
    Dim f As String
    f = Txt(CfgCell("CFG_File").Value)
    If Len(f) = 0 Then Exit Function
    If InStr(f, "\") > 0 Or InStr(f, "/") > 0 Then
        TargetPath = f
    Else
        TargetPath = ThisWorkbook.Path & Application.PathSeparator & f
    End If
End Function

Private Function OpenTarget(ByVal forWrite As Boolean, ByRef wasOpen As Boolean) As Workbook
    Dim p As String, w As Workbook, wb As Workbook
    p = TargetPath()
    If Len(p) = 0 Then
        MsgBox T("mNoFile"), vbExclamation
        Exit Function
    End If
    If Not FSO.FileExists(p) Then
        MsgBox T("mFileMissing") & vbLf & p, vbExclamation
        Exit Function
    End If
    For Each w In Application.Workbooks
        If StrComp(w.FullName, p, vbTextCompare) = 0 Then Set wb = w
    Next w
    If wb Is Nothing Then
        Set wb = Application.Workbooks.Open(Filename:=p, UpdateLinks:=0, ReadOnly:=Not forWrite, _
                                            Notify:=False, AddToMru:=False)
        wasOpen = False
    Else
        wasOpen = True
    End If
    If Not HasName(wb, "DB_Classes") Or Not HasName(wb, "LST_Status") Or Not HasName(wb, "LST_Type") Then
        MsgBox T("mBadFile"), vbCritical
        If Not wasOpen Then wb.Close SaveChanges:=False
        Exit Function
    End If
    If forWrite Then
        If wb.ReadOnly Or wb.MultiUserEditing Then
            MsgBox T("mNeedExclusive"), vbExclamation
            If Not wasOpen Then wb.Close SaveChanges:=False
            Exit Function
        End If
    End If
    Set OpenTarget = wb
End Function

Private Sub CloseTarget(wb As Workbook, ByVal wasOpen As Boolean, ByVal doSave As Boolean)
    If wb Is Nothing Then Exit Sub
    If doSave Then wb.Save
    If Not wasOpen Then wb.Close SaveChanges:=False
End Sub

Private Sub BackupTarget(wb As Workbook)
    Dim fld As String
    fld = FSO.GetParentFolderName(wb.FullName) & "\Backups"
    If Not FSO.FolderExists(fld) Then FSO.CreateFolder fld
    wb.SaveCopyAs fld & "\" & Format(Now, "yyyymmdd_hhnnss") & "_" & wb.Name
End Sub

Private Sub WriteLog(ByVal action As String, ByVal details As String)
    Dim ws As Worksheet, r As Long
    Set ws = ThisWorkbook.Worksheets(SH_LOG)
    r = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
    If r < 4 Then r = 4
    ws.Cells(r, 1).Value = Now
    ws.Cells(r, 1).NumberFormat = "yyyy/mm/dd hh:mm"
    ws.Cells(r, 2).Value = action
    ws.Cells(r, 3).Value = Left$(details, 30000)
    ws.Cells(r, 3).WrapText = False
End Sub

Private Sub ShowError()
    Dim d As String
    d = Err.Description
    EndWork
    MsgBox T("mError") & vbLf & d, vbCritical
End Sub

'=========================================================================
' report sheet
'=========================================================================
Private Sub RepStart(ByVal title As String)
    Set mRep = ThisWorkbook.Worksheets(SH_REPORT)
    mRep.Range("A4:C" & mRep.Rows.Count).Clear
    mRep.Range("A2").Value = title & "   " & Format(Now, "yyyy/mm/dd hh:nn")
    mRepRow = 4
    mErr = 0
    mWarn = 0
End Sub

Private Sub Rep(ByVal sev As Long, ByVal cls As String, ByVal msg As String)
    mRep.Cells(mRepRow, 1).Value = Choose(sev, T("sevErr"), T("sevWarn"), T("sevInfo"))
    mRep.Cells(mRepRow, 1).Interior.Color = Choose(sev, RGB(248, 203, 173), RGB(255, 242, 204), RGB(221, 235, 247))
    mRep.Cells(mRepRow, 2).Value = cls
    mRep.Cells(mRepRow, 3).Value = msg
    mRep.Range(mRep.Cells(mRepRow, 1), mRep.Cells(mRepRow, 3)).Borders.LineStyle = 1
    If sev = 1 Then mErr = mErr + 1
    If sev = 2 Then mWarn = mWarn + 1
    mRepRow = mRepRow + 1
End Sub

'=========================================================================
' SETUP : builds the control panel inside this workbook
'=========================================================================
Public Sub Setup()
    Dim keepFile As String, keepUntil As String, keepExec As String
    On Error Resume Next
    keepFile = Txt(ThisWorkbook.Names("CFG_File").RefersToRange.Value)
    keepUntil = Txt(ThisWorkbook.Names("CFG_FillUntil").RefersToRange.Value)
    keepExec = Txt(ThisWorkbook.Names("CFG_FillExec").RefersToRange.Value)
    Err.Clear
    On Error GoTo EH
    BeginWork
    BuildLists
    BuildPanel
    BuildReport
    BuildLog
    BuildHelp
    RemoveEmptySheets
    CfgCell("CFG_File").Value = keepFile
    If Len(keepFile) > 0 Then CfgCell("CFG_Folder").Value = FSO.GetParentFolderName(TargetPath())
    If Len(keepUntil) > 0 Then CfgCell("CFG_FillUntil").Value = keepUntil Else CfgCell("CFG_FillUntil").Value = T("optToday")
    If Len(keepExec) > 0 Then CfgCell("CFG_FillExec").Value = keepExec Else CfgCell("CFG_FillExec").Value = T("yes")
    ThisWorkbook.Worksheets(SH_PANEL).Move Before:=ThisWorkbook.Worksheets(1)
    ThisWorkbook.Worksheets(SH_PANEL).Activate
    ActiveWindow.DisplayGridlines = False
    ThisWorkbook.Worksheets(SH_PANEL).Range("A1").Select
    EndWork
    MsgBox T("mSetupDone"), vbInformation
    Exit Sub
EH:
    ShowError
End Sub

Private Function GetSheet(ByVal nm As String) As Worksheet
    Dim ws As Worksheet
    For Each ws In ThisWorkbook.Worksheets
        If ws.Name = nm Then
            Set GetSheet = ws
            Exit Function
        End If
    Next ws
    Set ws = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
    ws.Name = nm
    Set GetSheet = ws
End Function

Private Sub RemoveEmptySheets()
    Dim i As Long, ws As Worksheet
    For i = ThisWorkbook.Worksheets.Count To 1 Step -1
        Set ws = ThisWorkbook.Worksheets(i)
        Select Case ws.Name
            Case SH_PANEL, SH_REPORT, SH_LOG, SH_LISTS, SH_HELP
            Case Else
                If Application.WorksheetFunction.CountA(ws.Cells) = 0 And ws.Shapes.Count = 0 Then ws.Delete
        End Select
    Next i
End Sub

Private Sub StyleHeader(rg As Range)
    rg.Font.Bold = True
    rg.Font.Color = RGB(255, 255, 255)
    rg.Interior.Color = RGB(31, 56, 100)
    rg.HorizontalAlignment = xlCenter
    rg.VerticalAlignment = xlCenter
    rg.WrapText = True
    rg.Borders.LineStyle = 1
End Sub

Private Sub BuildLists()
    Dim ws As Worksheet
    Set ws = GetSheet(SH_LISTS)
    ws.Cells.Clear
    ws.DisplayRightToLeft = True
    ws.Cells(1, 1).Value = T("lUntil"):  ws.Cells(2, 1).Value = T("optToday"): ws.Cells(3, 1).Value = T("optEnd")
    ws.Cells(1, 2).Value = T("lYesNo"):  ws.Cells(2, 2).Value = T("yes"):      ws.Cells(3, 2).Value = T("no")
    ws.Cells(1, 3).Value = T("lPulses")
    ws.Cells(1, 4).Value = T("lMark"):   ws.Cells(2, 4).Value = CK()
    ws.Cells(1, 5).Value = T("lQuran")
    StyleHeader ws.Range("A1:E1")
    ws.Columns("A:E").ColumnWidth = 18
    ws.Range("C2:C500").NumberFormat = "@"
End Sub

Private Sub SectionRow(ws As Worksheet, ByVal r As Long, ByVal caption As String)
    With ws.Range(ws.Cells(r, 2), ws.Cells(r, 4))
        .Merge
        .Value = caption
        .Font.Bold = True
        .Font.Size = 13
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = RGB(31, 111, 120)
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
    End With
    ws.Rows(r).RowHeight = 26
End Sub

Private Sub ButtonRow(ws As Worksheet, ByVal r As Long, ByVal cap As String, ByVal macro As String, _
                      ByVal desc As String, ByVal clr As Long)
    Dim rg As Range, shp As Shape
    ws.Rows(r).RowHeight = 44
    Set rg = ws.Range(ws.Cells(r, 2), ws.Cells(r, 3))
    Set shp = ws.Shapes.AddShape(5, rg.Left + 4, rg.Top + 4, rg.Width - 8, rg.Height - 8)
    shp.Name = "btn_" & macro
    shp.Fill.ForeColor.RGB = clr
    shp.Line.Visible = 0
    With shp.TextFrame2
        .TextRange.Text = cap
        .TextRange.Font.Size = 12
        .TextRange.Font.Bold = -1
        .TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextRange.ParagraphFormat.Alignment = 2
        .VerticalAnchor = 3
        .WordWrap = -1
    End With
    On Error Resume Next
    shp.TextFrame2.TextRange.ParagraphFormat.TextDirection = 2
    On Error GoTo 0
    shp.OnAction = macro
    shp.Placement = 2
    With ws.Cells(r, 4)
        .Value = desc
        .WrapText = True
        .VerticalAlignment = xlCenter
        .HorizontalAlignment = xlRight
        .Font.Size = 10
        .Font.Color = RGB(64, 64, 64)
    End With
End Sub

Private Sub OptionRow(ws As Worksheet, ByVal r As Long, ByVal lbl As String, ByVal nm As String, _
                      ByVal listRef As String, ByVal desc As String)
    ws.Rows(r).RowHeight = 34
    With ws.Cells(r, 2)
        .Value = lbl
        .Font.Bold = True
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
    End With
    With ws.Cells(r, 3)
        .Interior.Color = RGB(255, 251, 234)
        .Borders.LineStyle = 1
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
        .Font.Bold = True
        .Validation.Delete
        .Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="=" & listRef
    End With
    ThisWorkbook.Names.Add Name:=nm, RefersTo:="='" & ws.Name & "'!" & ws.Cells(r, 3).Address
    With ws.Cells(r, 4)
        .Value = desc
        .WrapText = True
        .VerticalAlignment = xlCenter
        .HorizontalAlignment = xlRight
        .Font.Size = 10
        .Font.Color = RGB(64, 64, 64)
    End With
End Sub

Private Sub BuildPanel()
    Dim ws As Worksheet, i As Long
    Dim cBlue As Long, cGreen As Long, cRed As Long, cGrey As Long, cGold As Long
    cBlue = RGB(31, 56, 100): cGreen = RGB(84, 130, 53): cRed = RGB(192, 0, 0)
    cGrey = RGB(118, 118, 118): cGold = RGB(191, 143, 0)
    Set ws = GetSheet(SH_PANEL)
    ws.Activate
    For i = ws.Shapes.Count To 1 Step -1
        ws.Shapes(i).Delete
    Next i
    ws.Cells.Clear
    ws.Cells.Validation.Delete
    ws.DisplayRightToLeft = True
    ws.Cells.Font.Name = "Arial"
    ws.Cells.Font.Size = 11
    ws.Columns("A").ColumnWidth = 2
    ws.Columns("B").ColumnWidth = 17
    ws.Columns("C").ColumnWidth = 17
    ws.Columns("D").ColumnWidth = 62
    ws.Columns("E").ColumnWidth = 10
    ws.Columns("F").ColumnWidth = 10
    ws.Columns("G").ColumnWidth = 11
    ws.Columns("H").ColumnWidth = 9

    With ws.Range("B1:D1")
        .Merge
        .Value = T("title")
        .Font.Size = 20
        .Font.Bold = True
        .Font.Color = RGB(31, 56, 100)
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
    End With
    ws.Rows(1).RowHeight = 36
    With ws.Range("B2:D2")
        .Merge
        .Value = T("subtitle")
        .WrapText = True
        .Font.Size = 10
        .Font.Color = RGB(89, 89, 89)
        .HorizontalAlignment = xlRight
    End With
    ws.Rows(2).RowHeight = 30

    ws.Range("B4").Value = T("lblFile")
    ws.Range("B5").Value = T("lblFolder")
    ws.Range("B4:B5").Font.Bold = True
    ws.Range("B4:B5").HorizontalAlignment = xlRight
    ws.Range("C4:D4").Merge
    ws.Range("C5:D5").Merge
    With ws.Range("C4:D5")
        .Interior.Color = RGB(234, 241, 248)
        .Borders.LineStyle = 1
        .HorizontalAlignment = xlRight
        .Font.Bold = True
    End With
    ws.Range("C5").Font.Bold = False
    ws.Range("C5").Font.Size = 9
    ThisWorkbook.Names.Add Name:="CFG_File", RefersTo:="='" & SH_PANEL & "'!$C$4"
    ThisWorkbook.Names.Add Name:="CFG_Folder", RefersTo:="='" & SH_PANEL & "'!$C$5"

    SectionRow ws, 7, T("sec1")
    ButtonRow ws, 8, T("bLink"), "BtnLinkFile", T("dLink"), cBlue
    ButtonRow ws, 9, T("bRefresh"), "BtnRefresh", T("dRefresh"), cBlue

    SectionRow ws, 11, T("sec2")
    ButtonRow ws, 12, T("bCreate"), "BtnCreateSheets", T("dCreate"), cGreen
    ButtonRow ws, 13, T("bArchive"), "BtnArchive", T("dArchive"), cGold
    ButtonRow ws, 14, T("bDelete"), "BtnDelete", T("dDelete"), cRed
    ButtonRow ws, 15, T("bHealth"), "BtnHealth", T("dHealth"), cGrey

    SectionRow ws, 17, T("sec3")
    OptionRow ws, 18, T("oUntil"), "CFG_FillUntil", "'" & SH_LISTS & "'!$A$2:$A$3", T("dUntil")
    OptionRow ws, 19, T("oExec"), "CFG_FillExec", "'" & SH_LISTS & "'!$B$2:$B$3", T("dExec")
    ButtonRow ws, 20, T("bFill"), "BtnFillDates", T("dFill"), cGreen
    ws.Rows(20).RowHeight = 58

    SectionRow ws, 22, T("sec4")
    OptionRow ws, 23, T("oPulse"), "CFG_Pulse", "'" & SH_LISTS & "'!$C$2:$C$200", T("dPulse")
    ButtonRow ws, 24, T("bSelPulse"), "BtnSelectPulse", T("dSelPulse"), cBlue
    ButtonRow ws, 25, T("bSelAll"), "BtnSelectAll", T("dSelAll"), cGrey
    ButtonRow ws, 26, T("bClear"), "BtnClearSel", T("dClear"), cGrey
    ButtonRow ws, 27, T("bExport"), "BtnExport", T("dExport"), cGreen

    With ws.Range("B29:D29")
        .Merge
        .Value = T("note")
        .WrapText = True
        .Font.Size = 10
        .Font.Italic = True
        .Font.Color = RGB(89, 89, 89)
        .HorizontalAlignment = xlRight
    End With
    ws.Rows(29).RowHeight = 30
    ws.Range("B31").Value = T("lblVer") & " " & APP_VER
    ws.Range("B31").Font.Size = 9
    ws.Range("B31").Font.Color = RGB(150, 150, 150)

    ' class list
    With ws.Range(ws.Cells(LR0 - 2, LC), ws.Cells(LR0 - 2, LC + O_SHT))
        .Merge
        .Value = T("listTitle")
        .Font.Bold = True
        .Font.Size = 12
        .Font.Color = RGB(31, 56, 100)
        .HorizontalAlignment = xlRight
    End With
    ws.Cells(LR0 - 1, LC).Value = T("hSel")
    ws.Cells(LR0 - 1, LC + O_CLS).Value = T("hClass")
    ws.Cells(LR0 - 1, LC + O_TYP).Value = T("hType")
    ws.Cells(LR0 - 1, LC + O_PRT).Value = T("hPart")
    ws.Cells(LR0 - 1, LC + O_TEA).Value = T("hTeacher")
    ws.Cells(LR0 - 1, LC + O_STA).Value = T("hStatus")
    ws.Cells(LR0 - 1, LC + O_SHT).Value = T("hSheet")
    StyleHeader ws.Range(ws.Cells(LR0 - 1, LC), ws.Cells(LR0 - 1, LC + O_SHT))
    ws.Rows(LR0 - 1).RowHeight = 24
    PrepareList ws
End Sub

Private Sub PrepareList(ws As Worksheet)
    Dim rg As Range
    Set rg = ws.Range(ws.Cells(LR0, LC), ws.Cells(LR0 + MAXLIST, LC + O_SHT))
    rg.Clear
    rg.Font.Name = "Arial"
    rg.Font.Size = 10
    rg.NumberFormat = "@"
    rg.HorizontalAlignment = xlCenter
    rg.VerticalAlignment = xlCenter
    With ws.Range(ws.Cells(LR0, LC), ws.Cells(LR0 + MAXLIST, LC))
        .Validation.Delete
        .Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="='" & SH_LISTS & "'!$D$2"
        .Font.Bold = True
        .Font.Color = RGB(84, 130, 53)
        .Font.Size = 12
    End With
End Sub

Private Sub BuildReport()
    Dim ws As Worksheet
    Set ws = GetSheet(SH_REPORT)
    ws.Cells.Clear
    ws.DisplayRightToLeft = True
    ws.Cells.Font.Name = "Arial"
    ws.Range("A1").Value = T("repTitle")
    ws.Range("A1").Font.Size = 16
    ws.Range("A1").Font.Bold = True
    ws.Range("A3").Value = T("repSev")
    ws.Range("B3").Value = T("repClass")
    ws.Range("C3").Value = T("repMsg")
    StyleHeader ws.Range("A3:C3")
    ws.Columns("A").ColumnWidth = 10
    ws.Columns("B").ColumnWidth = 18
    ws.Columns("C").ColumnWidth = 100
End Sub

Private Sub BuildLog()
    Dim ws As Worksheet
    Set ws = GetSheet(SH_LOG)
    ws.DisplayRightToLeft = True
    ws.Range("A1").Value = T("logTitle")
    ws.Range("A1").Font.Size = 16
    ws.Range("A1").Font.Bold = True
    ws.Range("A3").Value = T("logTime")
    ws.Range("B3").Value = T("logAction")
    ws.Range("C3").Value = T("logDetails")
    StyleHeader ws.Range("A3:C3")
    ws.Columns("A").ColumnWidth = 17
    ws.Columns("B").ColumnWidth = 18
    ws.Columns("C").ColumnWidth = 100
End Sub

Private Sub BuildHelp()
    Dim ws As Worksheet, i As Long
    Set ws = GetSheet(SH_HELP)
    ws.Cells.Clear
    ws.DisplayRightToLeft = True
    ws.Cells.Font.Name = "Arial"
    ws.Columns("A").ColumnWidth = 130
    ws.Range("A1").Value = T("helpTitle")
    ws.Range("A1").Font.Size = 16
    ws.Range("A1").Font.Bold = True
    For i = 1 To 10
        ws.Cells(i + 2, 1).Value = T("help" & i)
        ws.Cells(i + 2, 1).WrapText = True
        ws.Rows(i + 2).RowHeight = 30
        ws.Cells(i + 2, 1).VerticalAlignment = xlCenter
    Next i
End Sub

'=========================================================================
' BUTTON: link teachers file
'=========================================================================
Public Sub BtnLinkFile()
    Dim fd As Object, p As String
    On Error GoTo EH
    Set fd = Application.FileDialog(3)
    With fd
        .Title = T("dlgPick")
        .AllowMultiSelect = False
        .InitialFileName = ThisWorkbook.Path & "\"
        .Filters.Clear
        .Filters.Add "Excel", "*.xlsx;*.xlsm"
        If .Show <> -1 Then Exit Sub
        p = .SelectedItems(1)
    End With
    If StrComp(FSO.GetParentFolderName(p), ThisWorkbook.Path, vbTextCompare) = 0 Then
        CfgCell("CFG_File").Value = FSO.GetFileName(p)
    Else
        CfgCell("CFG_File").Value = p
    End If
    CfgCell("CFG_Folder").Value = FSO.GetParentFolderName(p)
    WriteLog T("aLink"), p
    BtnRefresh
    Exit Sub
EH:
    ShowError
End Sub

'=========================================================================
' BUTTON: refresh class list
'=========================================================================
Public Sub BtnRefresh()
    Dim wb As Workbook, wasOpen As Boolean, db As Range, ws As Worksheet
    Dim r As Long, n As Long, i As Long, nm As String, pt As String, k As Variant
    Dim sel As Object, pul As Object, qLbl As String
    On Error GoTo EH
    Set ws = ThisWorkbook.Worksheets(SH_PANEL)
    Set sel = CreateObject("Scripting.Dictionary")
    sel.CompareMode = 1
    r = LR0
    Do While Len(Txt(ws.Cells(r, LC + O_CLS).Value)) > 0
        If Txt(ws.Cells(r, LC).Value) = CK() Then sel(Txt(ws.Cells(r, LC + O_CLS).Value)) = True
        r = r + 1
    Loop
    BeginWork
    Set wb = OpenTarget(False, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set db = wb.Names("DB_Classes").RefersToRange
    qLbl = LV(wb, "LST_Type", 2)
    PrepareList ws
    Set pul = CreateObject("Scripting.Dictionary")
    pul.CompareMode = 1
    For r = 2 To db.Rows.Count
        nm = Txt(db.Cells(r, C_NAME).Value)
        If Len(nm) > 0 And n < MAXLIST Then
            i = LR0 + n
            If sel.Exists(nm) Then ws.Cells(i, LC).Value = CK()
            ws.Cells(i, LC + O_CLS).Value = nm
            ws.Cells(i, LC + O_TYP).Value = Txt(db.Cells(r, C_TYPE).Value)
            pt = Txt(db.Cells(r, C_PART).Value)
            ws.Cells(i, LC + O_PRT).Value = pt
            ws.Cells(i, LC + O_TEA).Value = Txt(db.Cells(r, C_TEACHER).Value)
            ws.Cells(i, LC + O_STA).Value = Txt(db.Cells(r, C_STATUS).Value)
            If FindSheet(wb, nm) Is Nothing Then
                ws.Cells(i, LC + O_SHT).Value = T("missing")
                ws.Cells(i, LC + O_SHT).Font.Color = RGB(192, 0, 0)
            Else
                ws.Cells(i, LC + O_SHT).Value = CK()
                ws.Cells(i, LC + O_SHT).Font.Color = RGB(84, 130, 53)
            End If
            ws.Range(ws.Cells(i, LC), ws.Cells(i, LC + O_SHT)).Borders.LineStyle = 1
            If StrComp(ws.Cells(i, LC + O_TYP).Value, qLbl, vbTextCompare) = 0 Then
                ws.Cells(i, LC + O_TYP).Interior.Color = RGB(226, 239, 218)
            End If
            ws.Cells(i, LC).Interior.Color = RGB(255, 251, 234)
            If Len(pt) > 0 Then pul(pt) = True
            n = n + 1
        End If
    Next r
    With ThisWorkbook.Worksheets(SH_LISTS)
        .Range("C2:C500").ClearContents
        i = 2
        For Each k In pul.Keys
            .Cells(i, 3).Value = k
            i = i + 1
        Next k
        .Range("E2").Value = qLbl
    End With
    CloseTarget wb, wasOpen, False
    ws.Cells(LR0 - 2, LC).Value = T("listTitle") & "   " & T("lastRefresh") & " " & Format(Now, "yyyy/mm/dd hh:nn")
    EndWork
    Exit Sub
EH:
    ShowError
End Sub

Private Function Selected() As Collection
    Dim c As New Collection, ws As Worksheet, r As Long
    Set ws = ThisWorkbook.Worksheets(SH_PANEL)
    r = LR0
    Do While Len(Txt(ws.Cells(r, LC + O_CLS).Value)) > 0
        If Txt(ws.Cells(r, LC).Value) = CK() Then c.Add Txt(ws.Cells(r, LC + O_CLS).Value)
        r = r + 1
    Loop
    Set Selected = c
End Function

Public Sub BtnSelectPulse()
    Dim ws As Worksheet, r As Long, p As String, n As Long
    Set ws = ThisWorkbook.Worksheets(SH_PANEL)
    p = Txt(CfgCell("CFG_Pulse").Value)
    If Len(p) = 0 Then
        MsgBox T("mPickPulse"), vbExclamation
        Exit Sub
    End If
    r = LR0
    Do While Len(Txt(ws.Cells(r, LC + O_CLS).Value)) > 0
        If StrComp(Txt(ws.Cells(r, LC + O_PRT).Value), p, vbTextCompare) = 0 Then
            ws.Cells(r, LC).Value = CK()
            n = n + 1
        Else
            ws.Cells(r, LC).ClearContents
        End If
        r = r + 1
    Loop
    MsgBox Replace(T("mPulseSel"), "{n}", CStr(n)), vbInformation
End Sub

Public Sub BtnSelectAll()
    Dim ws As Worksheet, r As Long
    Set ws = ThisWorkbook.Worksheets(SH_PANEL)
    r = LR0
    Do While Len(Txt(ws.Cells(r, LC + O_CLS).Value)) > 0
        ws.Cells(r, LC).Value = CK()
        r = r + 1
    Loop
End Sub

Public Sub BtnClearSel()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(SH_PANEL)
    ws.Range(ws.Cells(LR0, LC), ws.Cells(LR0 + MAXLIST, LC)).ClearContents
End Sub

'=========================================================================
' BUTTON: create missing sheets (+ planned next classes)
'=========================================================================
Public Sub BtnCreateSheets()
    Dim wb As Workbook, wasOpen As Boolean, db As Range
    Dim r As Long, rr As Long, c As Long, n As Long, nm As String, st As String, ty As String, nx As String
    Dim sAct As String, tL As String, tQ As String, made As String, bad As String
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set db = wb.Names("DB_Classes").RefersToRange
    sAct = LV(wb, "LST_Status", 1)
    tL = LV(wb, "LST_Type", 1)
    tQ = LV(wb, "LST_Type", 2)
    BackupTarget wb

    ' pass 1: register planned "next" classes of CC classes
    For r = 2 To db.Rows.Count
        nm = Txt(db.Cells(r, C_NAME).Value)
        nx = Txt(db.Cells(r, C_NEXT).Value)
        st = Txt(db.Cells(r, C_STATUS).Value)
        If Len(nm) > 0 And Len(nx) > 0 And IsActiveStatus(st, sAct) Then
            If FindRow(db, nx) = 0 Then
                rr = FirstEmptyRow(db)
                If rr > 0 Then
                    db.Cells(rr, C_NAME).Value = nx
                    db.Cells(rr, C_TYPE).Value = tL
                    db.Cells(rr, C_TEACHER).Value = db.Cells(r, C_TEACHER).Value
                    db.Cells(rr, C_COURSE).Value = db.Cells(r, C_COURSE).Value
                    db.Cells(rr, C_PART).Value = db.Cells(r, C_PART).Value
                    If HasDateVal(db.Cells(r, C_TRANS).Value) Then db.Cells(rr, C_START).Value = db.Cells(r, C_TRANS).Value
                    For c = C_DAY1 To C_DAY3
                        db.Cells(rr, c).Value = db.Cells(r, c).Value
                    Next c
                    db.Cells(rr, C_STATUS).Value = sAct
                    made = made & vbLf & "  + " & nx & "   (" & T("fromCC") & " " & nm & ")"
                End If
            End If
        End If
    Next r

    ' pass 2: create sheets for active classes without a sheet
    For r = 2 To db.Rows.Count
        nm = Txt(db.Cells(r, C_NAME).Value)
        st = Txt(db.Cells(r, C_STATUS).Value)
        If Len(nm) > 0 And IsActiveStatus(st, sAct) Then
            If FindSheet(wb, nm) Is Nothing Then
                If ValidSheetName(nm) Then
                    ty = Txt(db.Cells(r, C_TYPE).Value)
                    If StrComp(ty, tQ, vbTextCompare) = 0 Then
                        CopyTemplate wb, "TPL_Quran", nm
                    Else
                        CopyTemplate wb, "TPL_Lessons", nm
                    End If
                    If InStr(made, "+ " & nm & "   (") = 0 Then made = made & vbLf & "  + " & nm
                    n = n + 1
                Else
                    bad = bad & vbLf & "  ! " & nm
                End If
            End If
        End If
    Next r

    wb.Worksheets(1).Activate
    Application.Calculate
    CloseTarget wb, wasOpen, (n > 0 Or Len(made) > 0)
    EndWork
    WriteLog T("aCreate"), CStr(n) & made
    If n = 0 And Len(bad) = 0 And Len(made) = 0 Then
        MsgBox T("mNothingCreate"), vbInformation
    Else
        MsgBox Replace(T("mCreated"), "{n}", CStr(n)) & made & _
               IIf(Len(bad) > 0, vbLf & vbLf & T("mBadNames") & bad, ""), vbInformation
    End If
    BtnRefresh
    Exit Sub
EH:
    ShowError
End Sub

Private Sub CopyTemplate(wb As Workbook, ByVal tplName As String, ByVal newName As String)
    Dim tpl As Worksheet, ws As Worksheet
    Set tpl = wb.Names(tplName).RefersToRange.Worksheet
    tpl.Copy After:=wb.Worksheets(wb.Worksheets.Count)
    Set ws = wb.Worksheets(wb.Worksheets.Count)
    ws.Name = newName
    ws.Visible = xlSheetVisible
    If tplName = "TPL_Quran" Then
        ws.Tab.Color = RGB(84, 130, 53)
    Else
        ws.Tab.Color = RGB(31, 111, 120)
    End If
End Sub

'=========================================================================
' BUTTON: archive classes marked for archiving
'=========================================================================
Public Sub BtnArchive()
    Dim wb As Workbook, wasOpen As Boolean, arc As Workbook, arcWasOpen As Boolean, db As Range
    Dim r As Long, n As Long, nm As String, sArc As String, src As Worksheet, shName As String
    Dim lst As New Collection, rowsC As New Collection, i As Long
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set db = wb.Names("DB_Classes").RefersToRange
    sArc = LV(wb, "LST_Status", 2)
    For r = 2 To db.Rows.Count
        nm = Txt(db.Cells(r, C_NAME).Value)
        If Len(nm) > 0 And StrComp(Txt(db.Cells(r, C_STATUS).Value), sArc, vbTextCompare) = 0 Then
            lst.Add nm
            rowsC.Add r
        End If
    Next r
    If lst.Count = 0 Then
        CloseTarget wb, wasOpen, False
        EndWork
        MsgBox T("mNoArchive"), vbInformation
        Exit Sub
    End If
    Application.ScreenUpdating = True
    If MsgBox(Replace(T("mConfirmArchive"), "{n}", CStr(lst.Count)) & ShortList(lst) & vbLf & vbLf & T("mContinue"), _
              vbYesNo + vbQuestion + vbDefaultButton2) <> vbYes Then
        CloseTarget wb, wasOpen, False
        EndWork
        Exit Sub
    End If
    Application.ScreenUpdating = False
    BackupTarget wb
    Set arc = OpenArchive(FSO.GetParentFolderName(wb.FullName), arcWasOpen)
    If arc Is Nothing Then
        CloseTarget wb, wasOpen, False
        EndWork
        Exit Sub
    End If
    For i = 1 To lst.Count
        nm = lst(i)
        r = rowsC(i)
        Set src = FindSheet(wb, nm)
        shName = ""
        If Not src Is Nothing Then shName = CopyToArchive(src, arc, nm)
        AddIndexRow arc, db, r, shName
        If Not src Is Nothing Then src.Delete
        db.Worksheet.Range(db.Cells(r, 1), db.Cells(r, C_STATUS)).ClearContents
        n = n + 1
    Next i
    BreakExternal arc
    arc.Worksheets("Index").Activate
    arc.Save
    If Not arcWasOpen Then arc.Close SaveChanges:=False
    wb.Worksheets(1).Activate
    Application.Calculate
    CloseTarget wb, wasOpen, True
    EndWork
    WriteLog T("aArchive"), CStr(n) & ShortList(lst)
    MsgBox Replace(T("mArchived"), "{n}", CStr(n)), vbInformation
    BtnRefresh
    Exit Sub
EH:
    ShowError
End Sub

Private Function OpenArchive(ByVal folder As String, ByRef wasOpen As Boolean) As Workbook
    Dim p As String, w As Workbook, wb As Workbook, ws As Worksheet
    p = folder & "\Archive.xlsx"
    For Each w In Application.Workbooks
        If StrComp(w.FullName, p, vbTextCompare) = 0 Then Set wb = w
    Next w
    If Not wb Is Nothing Then
        wasOpen = True
        Set OpenArchive = wb
        Exit Function
    End If
    wasOpen = False
    If FSO.FileExists(p) Then
        Set wb = Application.Workbooks.Open(Filename:=p, UpdateLinks:=0, ReadOnly:=False, Notify:=False, AddToMru:=False)
        If wb.ReadOnly Then
            MsgBox T("mArcLocked"), vbExclamation
            wb.Close SaveChanges:=False
            Exit Function
        End If
        If FindSheet(wb, "Index") Is Nothing Then
            Set ws = wb.Worksheets.Add(Before:=wb.Worksheets(1))
            ws.Name = "Index"
            BuildIndexHeader ws
        End If
    Else
        Set wb = Application.Workbooks.Add(xlWBATWorksheet)
        Set ws = wb.Worksheets(1)
        ws.Name = "Index"
        BuildIndexHeader ws
        wb.SaveAs Filename:=p, FileFormat:=51
    End If
    Set OpenArchive = wb
End Function

Private Sub BuildIndexHeader(ws As Worksheet)
    Dim i As Long
    ws.DisplayRightToLeft = True
    ws.Cells.Font.Name = "Arial"
    ws.Range("A1").Value = T("arcTitle")
    ws.Range("A1").Font.Size = 16
    ws.Range("A1").Font.Bold = True
    For i = 1 To 10
        ws.Cells(3, i).Value = T("ix" & i)
    Next i
    StyleHeader ws.Range("A3:J3")
    ws.Columns("A:B").ColumnWidth = 18
    ws.Columns("C:J").ColumnWidth = 13
End Sub

Private Function UniqueName(arc As Workbook, ByVal nm As String, self As Worksheet) As String
    Dim cand As String, k As Long, o As Worksheet
    cand = nm
    Do
        Set o = FindSheet(arc, cand)
        If o Is Nothing Then Exit Do
        If o Is self Then Exit Do
        k = k + 1
        cand = Left$(nm, 25) & " (" & k & ")"
    Loop
    UniqueName = cand
End Function

Private Function CopyToArchive(src As Worksheet, arc As Workbook, ByVal nm As String) As String
    Dim ws As Worksheet, c As Range, nn As String
    src.Copy After:=arc.Worksheets(arc.Worksheets.Count)
    Set ws = arc.Worksheets(arc.Worksheets.Count)
    Unprot ws
    For Each c In ws.UsedRange.Cells
        If c.HasFormula Then c.Value = c.Value
    Next c
    ws.Cells.Validation.Delete
    ws.Range("A3").Value = nm
    ws.Range("E1").Value = T("archivedOn") & " " & Format(Date, "yyyy/mm/dd")
    ws.Range("A1").Value = T("backIndex")
    ws.Hyperlinks.Add Anchor:=ws.Range("A1"), Address:="", SubAddress:="'Index'!A1", TextToDisplay:=T("backIndex")
    nn = UniqueName(arc, nm, ws)
    If ws.Name <> nn Then ws.Name = nn
    Prot ws
    CopyToArchive = nn
End Function

Private Sub AddIndexRow(arc As Workbook, db As Range, ByVal r As Long, ByVal shName As String)
    Dim ws As Worksheet, i As Long
    Set ws = arc.Worksheets("Index")
    i = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row + 1
    If i < 4 Then i = 4
    If Len(shName) > 0 Then
        ws.Hyperlinks.Add Anchor:=ws.Cells(i, 1), Address:="", SubAddress:="'" & shName & "'!A1", TextToDisplay:=shName
    Else
        ws.Cells(i, 1).Value = T("noSheet")
    End If
    ws.Cells(i, 2).NumberFormat = "@"
    ws.Cells(i, 2).Value = Txt(db.Cells(r, C_NAME).Value)
    ws.Cells(i, 3).Value = db.Cells(r, C_TYPE).Value
    ws.Cells(i, 4).Value = db.Cells(r, C_TEACHER).Value
    ws.Cells(i, 5).Value = db.Cells(r, C_COURSE).Value
    ws.Cells(i, 6).Value = db.Cells(r, C_PART).Value
    ws.Cells(i, 7).Value = db.Cells(r, C_START).Value
    ws.Cells(i, 8).Value = db.Cells(r, C_END).Value
    ws.Cells(i, 9).Value = db.Cells(r, C_NEXT).Value
    ws.Cells(i, 10).Value = Date
    ws.Range(ws.Cells(i, 7), ws.Cells(i, 8)).NumberFormat = "yyyy/mm/dd"
    ws.Cells(i, 10).NumberFormat = "yyyy/mm/dd"
    ws.Range(ws.Cells(i, 1), ws.Cells(i, 10)).Borders.LineStyle = 1
    ws.Range(ws.Cells(i, 1), ws.Cells(i, 10)).HorizontalAlignment = xlCenter
End Sub

Private Sub BreakExternal(wb As Workbook)
    Dim v As Variant, i As Long
    On Error Resume Next
    v = wb.LinkSources(xlExcelLinks)
    If Not IsEmpty(v) Then
        For i = LBound(v) To UBound(v)
            wb.BreakLink Name:=v(i), Type:=xlLinkTypeExcelLinks
        Next i
    End If
    For i = wb.Names.Count To 1 Step -1
        If InStr(wb.Names(i).RefersTo, "[") > 0 Or InStr(wb.Names(i).RefersTo, "#REF") > 0 Then wb.Names(i).Delete
    Next i
    On Error GoTo 0
End Sub

'=========================================================================
' BUTTON: delete classes marked for deletion
'=========================================================================
Public Sub BtnDelete()
    Dim wb As Workbook, wasOpen As Boolean, db As Range
    Dim r As Long, n As Long, nm As String, sDel As String, src As Worksheet
    Dim lst As New Collection, rowsC As New Collection, i As Long
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set db = wb.Names("DB_Classes").RefersToRange
    sDel = LV(wb, "LST_Status", 3)
    For r = 2 To db.Rows.Count
        nm = Txt(db.Cells(r, C_NAME).Value)
        If Len(nm) > 0 And StrComp(Txt(db.Cells(r, C_STATUS).Value), sDel, vbTextCompare) = 0 Then
            lst.Add nm
            rowsC.Add r
        End If
    Next r
    If lst.Count = 0 Then
        CloseTarget wb, wasOpen, False
        EndWork
        MsgBox T("mNoDelete"), vbInformation
        Exit Sub
    End If
    Application.ScreenUpdating = True
    If MsgBox(Replace(T("mConfirmDelete"), "{n}", CStr(lst.Count)) & ShortList(lst) & vbLf & vbLf & T("mContinue"), _
              vbYesNo + vbExclamation + vbDefaultButton2) <> vbYes Then
        CloseTarget wb, wasOpen, False
        EndWork
        Exit Sub
    End If
    Application.ScreenUpdating = False
    BackupTarget wb
    For i = 1 To lst.Count
        Set src = FindSheet(wb, CStr(lst(i)))
        If Not src Is Nothing Then src.Delete
        r = rowsC(i)
        db.Worksheet.Range(db.Cells(r, 1), db.Cells(r, C_STATUS)).ClearContents
        n = n + 1
    Next i
    wb.Worksheets(1).Activate
    Application.Calculate
    CloseTarget wb, wasOpen, True
    EndWork
    WriteLog T("aDelete"), CStr(n) & ShortList(lst)
    MsgBox Replace(T("mDeleted"), "{n}", CStr(n)), vbInformation
    BtnRefresh
    Exit Sub
EH:
    ShowError
End Sub

'=========================================================================
' holidays / teaching days
'=========================================================================
Private Sub LoadHolidays(wb As Workbook)
    Dim rg As Range, r As Long, a As Variant, b As Variant
    mHolN = 0
    ReDim mHolF(1 To 1)
    ReDim mHolT(1 To 1)
    If Not HasName(wb, "DB_Holidays") Then Exit Sub
    Set rg = wb.Names("DB_Holidays").RefersToRange
    For r = 2 To rg.Rows.Count
        a = rg.Cells(r, 1).Value
        b = rg.Cells(r, 2).Value
        If HasDateVal(a) Then
            mHolN = mHolN + 1
            ReDim Preserve mHolF(1 To mHolN)
            ReDim Preserve mHolT(1 To mHolN)
            mHolF(mHolN) = CDate(a)
            If HasDateVal(b) Then
                mHolT(mHolN) = CDate(b)
            Else
                mHolT(mHolN) = CDate(a)
            End If
        End If
    Next r
End Sub

Private Function IsHoliday(ByVal d As Date) As Boolean
    Dim i As Long
    For i = 1 To mHolN
        If d >= mHolF(i) And d <= mHolT(i) Then
            IsHoliday = True
            Exit Function
        End If
    Next i
End Function

Private Function DayNum(wb As Workbook, ByVal dayName As String) As Long
    Dim rg As Range, i As Long
    If Len(dayName) = 0 Then Exit Function
    Set rg = wb.Names("LST_Days").RefersToRange
    For i = 1 To rg.Rows.Count
        If StrComp(Txt(rg.Cells(i, 1).Value), dayName, vbTextCompare) = 0 Then
            DayNum = CLng(rg.Cells(i, 1).Offset(0, 1).Value)
            Exit Function
        End If
    Next i
End Function

Private Function IsTeachDay(ByVal d As Date) As Boolean
    Dim w As Long
    If d < mD0 Or d > mLim Then Exit Function
    w = Weekday(d, vbSunday)
    If w > 5 Then Exit Function
    If Not mDays(w) Then Exit Function
    If IsHoliday(d) Then Exit Function
    IsTeachDay = True
End Function

Private Function NextTeachDay(ByVal after As Double) As Double
    Dim d As Double
    d = Int(after) + 1
    If d < CDbl(mD0) Then d = CDbl(mD0)
    Do While d <= CDbl(mLim)
        If IsTeachDay(CDate(d)) Then
            NextTeachDay = d
            Exit Function
        End If
        d = d + 1
    Loop
    NextTeachDay = 0
End Function

'=========================================================================
' BUTTON: fill missing dates
'=========================================================================
Public Sub BtnFillDates()
    Dim lst As Collection, wb As Workbook, wasOpen As Boolean, db As Range
    Dim untilToday As Boolean, fillExec As Boolean, sAct As String, tQ As String
    Dim r As Long, nm As Variant, sh As Worksheet, nd As Long, ne As Long, why As String
    Dim totD As Long, totE As Long, eCount As Long, uTxt As String
    On Error GoTo EH
    uTxt = Txt(CfgCell("CFG_FillUntil").Value)
    untilToday = (StrComp(uTxt, Txt(ThisWorkbook.Worksheets(SH_LISTS).Range("A3").Value), vbTextCompare) <> 0)
    fillExec = (StrComp(Txt(CfgCell("CFG_FillExec").Value), Txt(ThisWorkbook.Worksheets(SH_LISTS).Range("B3").Value), vbTextCompare) <> 0)
    If untilToday Then uTxt = T("optToday") Else uTxt = T("optEnd")
    Set lst = Selected()
    If lst.Count = 0 Then
        If MsgBox(T("mFillAll"), vbYesNo + vbQuestion) <> vbYes Then Exit Sub
    End If
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set db = wb.Names("DB_Classes").RefersToRange
    sAct = LV(wb, "LST_Status", 1)
    tQ = LV(wb, "LST_Type", 2)
    If lst.Count = 0 Then
        For r = 2 To db.Rows.Count
            If Len(Txt(db.Cells(r, C_NAME).Value)) > 0 And IsActiveStatus(Txt(db.Cells(r, C_STATUS).Value), sAct) Then
                lst.Add Txt(db.Cells(r, C_NAME).Value)
            End If
        Next r
    End If
    Application.ScreenUpdating = True
    If MsgBox(Replace(Replace(T("mFillConfirm"), "{n}", CStr(lst.Count)), "{u}", uTxt), vbYesNo + vbQuestion) <> vbYes Then
        CloseTarget wb, wasOpen, False
        EndWork
        Exit Sub
    End If
    Application.ScreenUpdating = False
    LoadHolidays wb
    BackupTarget wb
    RepStart T("aFill") & " (" & uTxt & ")"
    For Each nm In lst
        r = FindRow(db, CStr(nm))
        Set sh = FindSheet(wb, CStr(nm))
        nd = 0: ne = 0: why = ""
        If r = 0 Then
            Rep 2, CStr(nm), T("whyNoRow")
        ElseIf sh Is Nothing Then
            Rep 2, CStr(nm), T("whyNoSheet")
        Else
            nd = FillOne(wb, sh, db, r, StrComp(Txt(db.Cells(r, C_TYPE).Value), tQ, vbTextCompare) = 0, _
                         untilToday, fillExec, ne, why)
            If Len(why) > 0 Then
                Rep 2, CStr(nm), why
            Else
                Rep 3, CStr(nm), Replace(Replace(T("fillLine"), "{d}", CStr(nd)), "{e}", CStr(ne))
                eCount = eCount + 1
            End If
            totD = totD + nd
            totE = totE + ne
        End If
    Next nm
    Application.Calculate
    CloseTarget wb, wasOpen, True
    EndWork
    WriteLog T("aFill"), uTxt & " | " & totD & " / " & totE
    ThisWorkbook.Worksheets(SH_REPORT).Activate
    MsgBox Replace(Replace(T("mFilled"), "{d}", CStr(totD)), "{e}", CStr(totE)), vbInformation
    Exit Sub
EH:
    ShowError
End Sub

Private Function FillOne(wb As Workbook, sh As Worksheet, db As Range, ByVal r As Long, ByVal isQ As Boolean, _
                         ByVal untilToday As Boolean, ByVal fillExec As Boolean, _
                         ByRef nExec As Long, ByRef why As String) As Long
    Dim dc(1 To 80) As Range, ec(1 To 80) As Range
    Dim n As Long, i As Long, j As Long, k As Long, c As Long, w As Long
    Dim d1 As Date, anyDay As Boolean, prev As Double, nxt As Double, dd As Double
    Dim filled As Long, teacher As String

    ' items in plan order
    If isQ Then
        For c = Q_C0 To Q_C1
            If Len(Txt(sh.Cells(Q_RLABEL, c).Value)) > 0 Then
                n = n + 1
                Set dc(n) = sh.Cells(Q_RDATE, c)
                Set ec(n) = sh.Cells(Q_REXEC, c)
            End If
        Next c
    Else
        For k = L_R0 To L_R1
            If Len(Txt(sh.Cells(k, L_TOPIC).Value)) > 0 Then
                n = n + 1
                Set dc(n) = sh.Cells(k, L_DATE)
                Set ec(n) = sh.Cells(k, L_EXEC)
            End If
        Next k
    End If
    If n = 0 Then Exit Function

    ' teaching period
    If Not HasDateVal(db.Cells(r, C_START).Value) Then
        why = T("whyNoStart")
        Exit Function
    End If
    mD0 = CDate(db.Cells(r, C_START).Value)
    If HasDateVal(db.Cells(r, C_END).Value) Then
        d1 = CDate(db.Cells(r, C_END).Value)
    Else
        If Not untilToday Then
            why = T("whyNoEnd")
            Exit Function
        End If
        d1 = DateSerial(2100, 1, 1)
    End If
    If untilToday And Date < d1 Then
        mLim = Date
    Else
        mLim = d1
    End If

    ' teaching days (Sun=1 .. Thu=5); none given = any day Sun..Thu
    For w = 1 To 7
        mDays(w) = False
    Next w
    anyDay = False
    For k = C_DAY1 To C_DAY3
        w = DayNum(wb, Txt(db.Cells(r, k).Value))
        If w >= 1 And w <= 5 Then
            mDays(w) = True
            anyDay = True
        End If
    Next k
    If Not anyDay Then
        For w = 1 To 5
            mDays(w) = True
        Next w
    End If

    Unprot sh
    prev = CDbl(mD0) - 1
    For i = 1 To n
        If HasDateVal(dc(i).Value) Then
            prev = CDbl(CDate(dc(i).Value))
        Else
            nxt = 0
            For j = i + 1 To n
                If HasDateVal(dc(j).Value) Then
                    nxt = CDbl(CDate(dc(j).Value))
                    Exit For
                End If
            Next j
            dd = NextTeachDay(prev)
            If dd = 0 Then Exit For
            If nxt > 0 And dd > nxt Then
                If IsTeachDay(CDate(prev)) Then
                    dd = prev
                Else
                    dd = nxt
                End If
            End If
            dc(i).Value = CDate(dd)
            dc(i).Font.Color = RGB(0, 112, 192)
            dc(i).Font.Italic = True
            prev = dd
            filled = filled + 1
        End If
    Next i

    If fillExec Then
        teacher = Txt(db.Cells(r, C_TEACHER).Value)
        If Len(teacher) > 0 Then
            For i = 1 To n
                If HasDateVal(dc(i).Value) And Len(Txt(ec(i).Value)) = 0 Then
                    ec(i).Value = teacher
                    ec(i).Font.Color = RGB(0, 112, 192)
                    ec(i).Font.Italic = True
                    nExec = nExec + 1
                End If
            Next i
        End If
    End If
    Prot sh
    FillOne = filled
End Function

'=========================================================================
' BUTTON: health check (read only)
'=========================================================================
Public Sub BtnHealth()
    Dim wb As Workbook, wasOpen As Boolean, db As Range, sh As Worksheet, n As Object
    Dim seen As Object, ids As Object, sysSheets As Object, r As Long, k As Long
    Dim nm As String, st As String, ty As String, sAct As String, sArc As String, sDel As String, tQ As String, absTxt As String
    Dim hasPeriod As Boolean, d0 As Date, d1 As Date, anyDay As Boolean, nx As String
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(False, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set db = wb.Names("DB_Classes").RefersToRange
    sAct = LV(wb, "LST_Status", 1)
    sArc = LV(wb, "LST_Status", 2)
    sDel = LV(wb, "LST_Status", 3)
    tQ = LV(wb, "LST_Type", 2)
    absTxt = LV(wb, "LST_Absent", 1)
    LoadHolidays wb
    RepStart T("bHealth")
    Set seen = CreateObject("Scripting.Dictionary"): seen.CompareMode = 1
    Set ids = CreateObject("Scripting.Dictionary"): ids.CompareMode = 1
    Set sysSheets = CreateObject("Scripting.Dictionary"): sysSheets.CompareMode = 1
    For Each n In wb.Names
        If Left$(n.Name, 4) = "SYS_" Or Left$(n.Name, 4) = "TPL_" Then
            On Error Resume Next
            sysSheets(n.RefersToRange.Worksheet.Name) = True
            On Error GoTo EH
        End If
    Next n

    For r = 2 To db.Rows.Count
        nm = Txt(db.Cells(r, C_NAME).Value)
        If Len(nm) > 0 Then
            st = Txt(db.Cells(r, C_STATUS).Value)
            ty = Txt(db.Cells(r, C_TYPE).Value)
            If seen.Exists(nm) Then
                Rep 1, nm, T("hcDup")
            Else
                seen(nm) = True
            End If
            If Not ValidSheetName(nm) Then Rep 1, nm, T("hcBadName")
            Set sh = FindSheet(wb, nm)
            If IsActiveStatus(st, sAct) And sh Is Nothing Then Rep 1, nm, T("hcNoSheet")
            If (StrComp(st, sArc, vbTextCompare) = 0 Or StrComp(st, sDel, vbTextCompare) = 0) Then Rep 3, nm, T("hcPending")
            If Len(Txt(db.Cells(r, C_TEACHER).Value)) = 0 Then Rep 2, nm, T("hcNoTeacher")
            hasPeriod = HasDateVal(db.Cells(r, C_START).Value) And HasDateVal(db.Cells(r, C_END).Value)
            If hasPeriod Then
                d0 = CDate(db.Cells(r, C_START).Value)
                d1 = CDate(db.Cells(r, C_END).Value)
            Else
                Rep 2, nm, T("hcNoPeriod")
            End If
            anyDay = False
            For k = C_DAY1 To C_DAY3
                If Len(Txt(db.Cells(r, k).Value)) > 0 Then anyDay = True
            Next k
            If Not anyDay Then Rep 3, nm, T("hcNoDays")
            nx = Txt(db.Cells(r, C_NEXT).Value)
            If Len(nx) > 0 Then
                If Not HasDateVal(db.Cells(r, C_TRANS).Value) Then Rep 2, nm, T("hcNoTrans")
                If FindRow(db, nx) = 0 Then Rep 3, nm, T("hcNextNoRow") & " " & nx
            End If
            If Not sh Is Nothing Then
                If StrComp(ty, tQ, vbTextCompare) = 0 Then
                    CheckQuran sh, nm, hasPeriod, d0, d1, absTxt, ids
                Else
                    CheckLessons sh, nm, hasPeriod, d0, d1
                End If
            End If
        End If
    Next r
    For Each sh In wb.Worksheets
        If Not sysSheets.Exists(sh.Name) And Not seen.Exists(sh.Name) Then Rep 3, sh.Name, T("hcOrphan")
    Next sh
    If mRepRow = 4 Then Rep 3, "", T("hcOk")
    CloseTarget wb, wasOpen, False
    EndWork
    WriteLog T("aHealth"), mErr & " / " & mWarn
    ThisWorkbook.Worksheets(SH_REPORT).Activate
    MsgBox Replace(Replace(T("mHealthDone"), "{e}", CStr(mErr)), "{w}", CStr(mWarn)), vbInformation
    Exit Sub
EH:
    ShowError
End Sub

Private Sub CheckDateCell(ByVal v As Variant, ByVal ex As Variant, ByVal nm As String, ByVal where As String, _
                          ByVal hasPeriod As Boolean, ByVal d0 As Date, ByVal d1 As Date)
    Dim d As Date
    If Len(Txt(v)) = 0 Then Exit Sub
    If Not HasDateVal(v) Then
        Rep 1, nm, T("hcBadDate") & " - " & where
        Exit Sub
    End If
    d = CDate(v)
    If Weekday(d, vbSunday) > 5 Then Rep 2, nm, T("hcWeekend") & " - " & where & " - " & Format(d, "yyyy/mm/dd")
    If hasPeriod Then
        If d < d0 Or d > d1 Then Rep 2, nm, T("hcOut") & " - " & where & " - " & Format(d, "yyyy/mm/dd")
    End If
    If IsHoliday(d) Then Rep 2, nm, T("hcHoliday") & " - " & where & " - " & Format(d, "yyyy/mm/dd")
    If Len(Txt(ex)) = 0 Then Rep 2, nm, T("hcNoExec") & " - " & where
End Sub

Private Sub CheckLessons(sh As Worksheet, ByVal nm As String, ByVal hasPeriod As Boolean, ByVal d0 As Date, ByVal d1 As Date)
    Dim r As Long
    For r = L_R0 To L_R1
        If Len(Txt(sh.Cells(r, L_TOPIC).Value)) > 0 Then
            CheckDateCell sh.Cells(r, L_DATE).Value, sh.Cells(r, L_EXEC).Value, nm, T("row") & " " & r, hasPeriod, d0, d1
        End If
    Next r
End Sub

Private Sub CheckQuran(sh As Worksheet, ByVal nm As String, ByVal hasPeriod As Boolean, ByVal d0 As Date, ByVal d1 As Date, _
                       ByVal absTxt As String, ids As Object)
    Dim c As Long, r As Long, v As Variant, lbl As String, id As String, sn As String, hasG As Boolean, bad As Boolean
    For c = Q_C0 To Q_C1
        lbl = Txt(sh.Cells(Q_RLABEL, c).Value)
        If Len(lbl) > 0 Then
            hasG = Application.WorksheetFunction.CountA(sh.Range(sh.Cells(Q_S0, c), sh.Cells(Q_S1, c))) > 0
            If hasG And Len(Txt(sh.Cells(Q_RDATE, c).Value)) = 0 Then Rep 2, nm, T("hcGradesNoDate") & " - " & lbl
            CheckDateCell sh.Cells(Q_RDATE, c).Value, sh.Cells(Q_REXEC, c).Value, nm, lbl, hasPeriod, d0, d1
        End If
    Next c
    For r = Q_S0 To Q_S1
        id = Txt(sh.Cells(r, Q_ID).Value)
        sn = Txt(sh.Cells(r, Q_SNAME).Value)
        hasG = Application.WorksheetFunction.CountA(sh.Range(sh.Cells(r, Q_C0), sh.Cells(r, Q_C1))) > 0
        If Len(id) = 0 Then
            If Len(sn) > 0 Or hasG Then Rep 1, nm, T("hcNoId") & " - " & T("row") & " " & r
        Else
            If ids.Exists(id) Then
                Rep 1, nm, Replace(T("hcDupId"), "{id}", id) & " " & ids(id)
            Else
                ids(id) = nm
            End If
            If Len(sn) = 0 Then Rep 2, nm, T("hcNoStudentName") & " - " & id
        End If
        For c = Q_C0 To Q_C1
            v = sh.Cells(r, c).Value
            If Len(Txt(v)) > 0 Then
                bad = False
                If VarType(v) = vbString Then
                    If StrComp(Txt(v), absTxt, vbTextCompare) <> 0 Then bad = True
                ElseIf IsNumeric(v) Then
                    If v < 0 Or v > 10 Then bad = True
                Else
                    bad = True
                End If
                If bad Then Rep 1, nm, T("hcBadGrade") & " - " & T("row") & " " & r & " - " & T("seg") & " " & (c - Q_C0 + 1) & " : " & Txt(v)
            End If
        Next c
    Next r
End Sub

'=========================================================================
' BUTTON: export Quran scores
'=========================================================================
Public Sub BtnExport()
    Dim lst As Collection, wb As Workbook, wasOpen As Boolean, db As Range, tQ As String
    Dim outWb As Workbook, ws As Worksheet, sh As Worksheet, nm As Variant, i As Long, r As Long, n As Long, k As Long
    Dim miss As String, fld As String, fn As String, idv As String, sc As Variant, used As Long
    On Error GoTo EH
    Set lst = Selected()
    If lst.Count = 0 Then
        MsgBox T("mNoQuranSel"), vbExclamation
        Exit Sub
    End If
    BeginWork
    Set wb = OpenTarget(False, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set db = wb.Names("DB_Classes").RefersToRange
    tQ = LV(wb, "LST_Type", 2)
    Application.Calculate
    Set outWb = Application.Workbooks.Add(xlWBATWorksheet)
    Set ws = outWb.Worksheets(1)
    ws.Name = "Scores"
    ws.Range("A1").Value = "Academic No"
    ws.Range("B1").Value = "Cadet Name"
    ws.Range("C1").Value = "Score"
    ws.Range("D1").Value = "Class"
    i = 2
    For Each nm In lst
        k = FindRow(db, CStr(nm))
        If k > 0 Then
            If StrComp(Txt(db.Cells(k, C_TYPE).Value), tQ, vbTextCompare) = 0 Then
                Set sh = FindSheet(wb, CStr(nm))
                If sh Is Nothing Then
                    miss = miss & vbLf & "  - " & nm
                Else
                    used = used + 1
                    For r = Q_S0 To Q_S1
                        idv = Txt(sh.Cells(r, Q_ID).Value)
                        If Len(idv) > 0 Then
                            ws.Cells(i, 1).NumberFormat = "@"
                            ws.Cells(i, 1).Value = idv
                            ws.Cells(i, 2).Value = Txt(sh.Cells(r, Q_SNAME).Value)
                            sc = sh.Cells(r, Q_AVG).Value
                            If Not IsError(sc) Then
                                If IsNumeric(sc) And Len(Txt(sc)) > 0 Then ws.Cells(i, 3).Value = CLng(sc)
                            End If
                            ws.Cells(i, 4).NumberFormat = "@"
                            ws.Cells(i, 4).Value = CStr(nm)
                            i = i + 1
                            n = n + 1
                        End If
                    Next r
                End If
            End If
        End If
    Next nm
    CloseTarget wb, wasOpen, False
    If used = 0 Then
        outWb.Close SaveChanges:=False
        EndWork
        MsgBox T("mNoQuranSel") & IIf(Len(miss) > 0, vbLf & T("mMissingSheets") & miss, ""), vbExclamation
        Exit Sub
    End If
    With ws.Range("A1:D1")
        .Font.Bold = True
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = RGB(31, 56, 100)
        .HorizontalAlignment = xlCenter
    End With
    ws.Range("A1:D" & (i - 1)).Borders.LineStyle = 1
    ws.Range("C2:C" & (i - 1)).HorizontalAlignment = xlCenter
    ws.Columns("A:D").AutoFit
    fld = FSO.GetParentFolderName(TargetPath()) & "\Exports"
    If Not FSO.FolderExists(fld) Then FSO.CreateFolder fld
    fn = fld & "\Cadet_Scores_" & Format(Now, "yyyymmdd_hhnnss") & ".xlsx"
    outWb.SaveAs Filename:=fn, FileFormat:=51
    EndWork
    WriteLog T("aExport"), n & " | " & fn
    outWb.Activate
    MsgBox Replace(T("mExported"), "{n}", CStr(n)) & vbLf & fn & _
           IIf(Len(miss) > 0, vbLf & vbLf & T("mMissingSheets") & miss, ""), vbInformation
    Exit Sub
EH:
    ShowError
End Sub

'=========================================================================
' Arabic text (Unicode hex, 4 digits per character)
'=========================================================================
Private Function AR(ByVal h As String) As String
    Dim i As Long, s As String
    For i = 1 To Len(h) Step 4
        s = s & ChrW(CLng("&H" & Mid$(h, i, 4)))
    Next i
    AR = s
End Function

Private Function T(ByVal k As String) As String
    Dim s As String
    Select Case k
    Case "aArchive"
        s = AR("06230631063406410629")
    Case "aCreate"
        s = AR("06250646063406270621002006230648063106270642")
    Case "aDelete"
        s = AR("062D06300641")
    Case "aExport"
        s = AR("062A0635062F064A0631002006270644062F0631062C0627062A")
    Case "aFill"
        s = AR("062A0639062806260629002006270644062A064806270631064A062E")
    Case "aHealth"
        s = AR("0641062D0635")
    Case "aLink"
        s = AR("063106280637002006270644064506440641")
    Case "andMore"
        s = AR("0648063A064A063106470627002E002E002E")
    Case "arcTitle"
        s = AR("0641064706310633002006270644062306310634064A0641")
    Case "archivedOn"
        s = AR("0623064F06310634064100200641064A")
    Case "bArchive"
        s = AR("062306310634064106290020062706440641063506480644002000AB064406440623063106340641062900BB")
    Case "bClear"
        s = AR("06450633062D002006270644062A062D062F064A062F")
    Case "bCreate"
        s = AR("062506460634062706210020062706440623064806310627064200200627064406460627064206350629")
    Case "bDelete"
        s = AR("062D063006410020062706440641063506480644002000AB06440644062D0630064100BB")
    Case "bExport"
        s = AR("062A0635062F064A0631002006270644062F0631062C0627062A")
    Case "bFill"
        s = AR("062A0639062806260629002006270644062A064806270631064A062E00200627064406460627064206350629")
    Case "bHealth"
        s = AR("0641062D0635002006330644062706450629002006270644064506440641")
    Case "bLink"
        s = AR("06310628063700200645064406410020062706440645062F06310633064A0646")
    Case "bRefresh"
        s = AR("062A062D062F064A062B0020064206270626064506290020062706440641063506480644")
    Case "bSelAll"
        s = AR("062A062D062F064A062F00200627064406430644")
    Case "bSelPulse"
        s = AR("062A062D062F064A062F00200641063506480644002006270644062806440633")
    Case "backIndex"
        s = AR("25C000200641064706310633002006270644062306310634064A0641")
    Case "dArchive"
        s = AR("064A0646064206440020062306480631062706420020062706440641063506480644002006270644062A064A0020062D06270644062A06470627002000AB064406440623063106340641062900BB002006250644064900200041007200630068006900760065002E0078006C00730078002006430642064A06450020062B06270628062A062900200645063900200641064706310633060C0020062B06450020064A062D063006410647062700200645064600200645064406410020062706440645062F06310633")
        s = s & AR("064A064600200648064A06450633062D002006330637063106470627002E0020064A0639063106360020062706440642062706260645062900200648064A063706440628002006270644062A06230643064A062F002E0020064A062D062A0627062C00200625064A064206270641002006270644064506340627063106430629002E")
    Case "dClear"
        s = AR("064A0632064A064400200643064400200627064406390644062706450627062A00200645064600200627064406420627062606450629002E")
    Case "dCreate"
        s = AR("064A0646063406260020064806310642062900200644064306440020064106350644002000AB06460634063700BB00200644064A0633002006440647002006480631064206290020002806450646002000AB0646064506480630062C00BB002006230648002000AB0646064506480630062C0020064206310622064600BB0020062D063306280020062706440646064806390029002E0020064806250646002006430627064600200644064106350644002000430043002000AB0641063506440020062A06270644")
        s = s & AR("064D00BB0020063A064A0631002006450633062C064E06510644060C0020064A0636064A0641064700200641064A00200628064A062706460627062A005F06270644064106350648064400200648064A0646063406260020062E0637062A0647002E0020064A062D062A0627062C00200625064A064206270641002006270644064506340627063106430629002E")
    Case "dDelete"
        s = AR("064A062D0630064100200646064706270626064A064B06270020062306480631062706420020062706440641063506480644002006270644062A064A0020062D06270644062A06470627002000AB06440644062D0630064100BB00200648064A06450633062D002006330637063106470627060C0020062806440627002006230631063406410629002E0020064A0639063106360020062706440642062706260645062900200648064A063706440628002006270644062A06230643064A062F002E0020064A062D")
        s = s & AR("062A0627062C00200625064A064206270641002006270644064506340627063106430629002E")
    Case "dExec"
        s = AR("00AB06460639064500BB003A0020064306440020062D0635062900200644064706270020062A06270631064A062E002006480644064A06330020064406470627002006450646064106300020064A064F0643062A062800200641064A0647062700200645062F06310633002006270644064106350644002E")
    Case "dExport"
        s = AR("064A0635062F065106310020062F0631062C0627062A0020064106350648064400200627064406420631062206460020062706440645062D062F062F06290020062506440649002006450644064100200045007800630065006C0020062C062F064A062F00200641064A00200645062C0644062F0020004500780070006F00720074007300200628062306310628063906290020062306390645062F0629003A002000410063006100640065006D006900630020004E006F00200648002000430061006400650074")
        s = s & AR("0020004E0061006D006500200648002000530063006F007200650020002806450646002000310030003000290020064800200043006C006100730073002E0020064A0639064506440020064806270644064506440641002006450634062706310643002E")
    Case "dFill"
        s = AR("0644064406410635064806440020062706440645062D062F062F062900200641064A002006270644064206270626064506290020002806230648002006430644002006270644064106350648064400200627064406460634063706290020062506460020064406450020062A062D062F062F00200634064A0626064B06270029002E0020064A0639062806510626002006270644064106270631063A002006410642063700200648064406270020064A06450633065100200623064A0020062A06270631064A062E")
        s = s & AR("002006450633062C064E06510644003A0020064506460020062706440623062D062F0020062506440649002006270644062E0645064A0633060C00200641064A00200623064A062706450020062D06350635002006270644064106350644060C0020062F0627062E064400200641062A0631062A0647060C002006280639064A062F064B06270020063906460020062706440625062C062706320627062A060C0020064806280639062F0020062A06270631064A062E002006270644062D06350629002006270644")
        s = s & AR("06330627062806420629002E002006270644062A064806270631064A062E0020062706440645063906280651062306290020062A063806470631002006280644064806460020062306320631064200200645062706260644002E0020064A062D062A0627062C00200625064A064206270641002006270644064506340627063106430629002E")
    Case "dHealth"
        s = AR("064A0641062D0635003A0020062706440623064806310627064200200627064406460627064206350629060C00200627064406230633064506270621002006480627064406230631064206270645002006270644062306430627062F064A0645064A062900200627064406450643063106310629060C002006270644062F0631062C0627062A002006270644062E0627063706260629060C002006270644062A064806270631064A062E0020062E06270631062C0020062706440641062A06310629002006230648")
        s = s & AR("00200641064A00200639063706440629060C002006270644062D06350635002006280644062700200645064606410630002E0020062706440646062A064A062C062900200641064A002006480631064206290020005200650070006F00720074002E0020064406270020064A063A064A0651063100200634064A0626064B0627002E")
    Case "dLink"
        s = AR("0627062E062A063100200645064406410020062E06370629002006270644062A062F0631064A06330020064506310629002006480627062D062F0629002E0020064A064F062D06410638002006270633064506470020064706460627060C00200648064A064F0628062D062B00200639064606470020062F062706260645064B062700200641064A002006460641063300200645062C0644062F00200647063006470020062706440623062F06270629002006450647064506270020064306270646002006270633")
        s = s & AR("06450020062706440645062C0644062F002E")
    Case "dPulse"
        s = AR("0627062E062A06310020062706440628064406330020002806270644062C0632062100290020062B0645002006270636063A0637002000AB062A062D062F064A062F0020064106350648064400200627064406280644063300BB002E0020062A0645062A0644062600200627064406420627062606450629002006280639062F002000AB062A062D062F064A062B002006420627062606450629002006270644064106350648064400BB002E")
    Case "dRefresh"
        s = AR("064A064206310623002006270644064106350648064400200645064600200645064406410020062706440645062F06310633064A064600200648064A0639063106360647062700200641064A002006270644064206270626064506290020062306330641064400200627064406440648062D0629002E0020064406270020064A063A064A0651063100200634064A0626064B0627060C00200648064A0639064506440020064806270644064506440641002006450634062706310643002E")
    Case "dSelAll"
        s = AR("064A06360639002006390644062706450629002027130020063906440649002006430644002006270644064106350648064400200641064A00200627064406420627062606450629002E")
    Case "dSelPulse"
        s = AR("064A06360639002006390644062706450629002027130020063906440649002006430644002006410635064806440020062706440628064406330020062706440645062E062A0627063100200648064A0632064A0644064706270020063906460020063A064A063106470627002E00200648064A0645064306460643002006280639062F064706270020062A0639062F064A0644002006270644062A062D062F064A062F0020064A062F0648064A064B06270020064506460020063906450648062F002000AB062A")
        s = s & AR("062D062F064A062F00BB002E")
    Case "dUntil"
        s = AR("00AB062D062A0649002006270644064A0648064500BB002000280627064406450633062A062D063306460029003A0020064A0639062806510626002006270644062D06350635002006270644062A064A00200643062706460020064A062C06280020062306460020062A064F0642062F064E065106450020062D062A0649002006270644064A064806450020064106420637002E002000AB062D062A06490020064606470627064A062900200627064406410635064400BB003A0020064A06390628065106260020")
        s = s & AR("06270644062E0637062900200643064406470627002E")
    Case "dlgPick"
        s = AR("0627062E062A063100200645064406410020062E06370629002006270644062A062F0631064A0633")
    Case "fillLine"
        s = AR("062A064806270631064A062E0020064506390628065106230629003A0020007B0064007D00200020007C002000200645064606410630002006450639062806510623003A0020007B0065007D")
    Case "fromCC"
        s = AR("0641063506440020062A06270644064D002006440640")
    Case "hClass"
        s = AR("06270644064106350644")
    Case "hPart"
        s = AR("06270644062806440633")
    Case "hSel"
        s = AR("062A062D062F064A062F")
    Case "hSheet"
        s = AR("062706440648063106420629")
    Case "hStatus"
        s = AR("06270644062D062706440629")
    Case "hTeacher"
        s = AR("062706440645062F06310633")
    Case "hType"
        s = AR("06270644064606480639")
    Case "hcBadDate"
        s = AR("0642064A064506290020063A064A06310020063506270644062D062900200641064A0020062E062706460629002006270644062A06270631064A062E")
    Case "hcBadGrade"
        s = AR("062F0631062C06290020063A064A06310020063506270644062D062900200028062706440645063306450648062D002006450646002000300020062506440649002000310030002006230648002000AB063A06270626062800BB0029")
    Case "hcBadName"
        s = AR("0631064206450020062706440641063506440020064406270020064A06350644062D0020062706330645064B06270020064406480631064206290020002806230637064806440020064506460020003300310020062D06310641064B062700200623064800200641064A06470020063106450648063200200645064506460648063906290029")
    Case "hcDup"
        s = AR("0631064206450020062706440641063506440020064506430631063100200641064A00200628064A062706460627062A005F062706440641063506480644")
    Case "hcDupId"
        s = AR("06270644063106420645002006270644062306430627062F064A0645064A0020007B00690064007D00200645064306310631060C0020064806450648062C0648062F00200623064A0636064B062700200641064A003A")
    Case "hcGradesNoDate"
        s = AR("064506420637063900200641064A06470020062F0631062C0627062A00200628064406270020062A06270631064A062E0020062A06460641064A0630")
    Case "hcHoliday"
        s = AR("062A06270631064A062E00200641064A00200625062C062706320629")
    Case "hcNextNoRow"
        s = AR("06270644064106350644002006270644062A06270644064A0020063A064A0631002006450633062C064E06510644002006280639062F00200641064A00200628064A062706460627062A005F062706440641063506480644003A")
    Case "hcNoDays"
        s = AR("0623064A06270645002006270644062D063506350020063A064A063100200645062D062F062F0629")
    Case "hcNoExec"
        s = AR("062D0635062900200644064706270020062A06270631064A062E002006280644062700200645064606410630")
    Case "hcNoId"
        s = AR("0635064100200641064A064700200627063306450020062306480020062F0631062C0627062A002006280644062700200631064206450020062306430627062F064A0645064A")
    Case "hcNoPeriod"
        s = AR("0628062F0627064A06290020062706440641063506440020062306480020064606470627064A062A06470020063A064A063100200645062D062F062F0629")
    Case "hcNoSheet"
        s = AR("0641063506440020064606340637002006280644062700200648063106420629")
    Case "hcNoStudentName"
        s = AR("063706270644062800200628064406270020062706330645")
    Case "hcNoTeacher"
        s = AR("064406270020064A0648062C062F00200645062F06310633")
    Case "hcNoTrans"
        s = AR("06440647002000AB0641063506440020062A06270644064D00BB00200628064406270020062A06270631064A062E002006270646062A064206270644")
    Case "hcOk"
        s = AR("064406270020062A0648062C062F0020064506440627062D06380627062A002E002006270644064506440641002006330644064A0645002E")
    Case "hcOrphan"
        s = AR("06480631064206290020063A064A0631002006450633062C06510644062900200641064A00200628064A062706460627062A005F062706440641063506480644")
    Case "hcOut"
        s = AR("062A06270631064A062E0020062E06270631062C00200641062A06310629002006270644064106350644")
    Case "hcPending"
        s = AR("062D06270644062A0647002000AB064406440623063106340641062900BB002006230648002000AB06440644062D0630064100BB00200648064406450020062A064F06460641064E06510630002006280639062F")
    Case "hcWeekend"
        s = AR("062A06270631064A062E00200641064A002006270644062C06450639062900200623064800200627064406330628062A")
    Case "help1"
        s = AR("0661002900200636063900200647063006470020062706440623062F0627062900200641064A002006460641063300200645062C0644062F00200645064406410020062706440645062F06310633064A06460020002806480628062C06480627063106470645062700200633064A064F06460634062300200041007200630068006900760065002E0078006C00730078002006480645062C0644062F0627062A0020004200610063006B007500700073002006480020004500780070006F0072007400730029002E")
    Case "help10"
        s = AR("06610660002900200627064406430648062F002006450648062C0648062F00200641064A00200647063006470020062706440623062F062706290020064106420637060C00200641064406270020064A062D062A0627062C0020062706440645062F063106330648064600200625064406490020062A06410639064A064400200623064A002006450627064306310648002E")
    Case "help2"
        s = AR("06620029002006270636063A0637002000AB06310628063700200645064406410020062706440645062F06310633064A064600BB0020064506310629002006480627062D062F0629002006480627062E062A0631002006270644064506440641002E0020064406270020064A0644063206450020062A063A064A064A0631002006270633064500200627064406450644064100200648064406270020062706440645062C0644062F0020064806440648002006430627064606270020062806270644063906310628")
        s = s & AR("064A0629002E")
    Case "help3"
        s = AR("06630029002006270636063A0637002000AB062A062D062F064A062B002006420627062606450629002006270644064106350648064400BB002006430644064506270020063A064A06510631062A00200628064A062706460627062A005F06270644064106350648064400200641064A00200645064406410020062706440645062F06310633064A0646002E")
    Case "help4"
        s = AR("06640029002006270644063906450644064A0627062A002006270644062A064A0020062A063A064A065106310020062706440645064406410020002806250646063406270621060C002006230631063406410629060C0020062D06300641060C0020062A063906280626062900290020062A062D062A0627062C00200625064A064206270641002006270644064506340627063106430629060C00200648062306460020064A06430648064600200627064406450644064100200645063A06440642064B06270020")
        s = s & AR("06390646062F0020062706440622062E0631064A0646002E")
    Case "help5"
        s = AR("06650029002006270644062A062D062F064A062B00200648062706440641062D06350020064806270644062A0635062F064A06310020062A06390645064400200648062706440645064406410020064506340627063106430020064806450641062A0648062D002006390646062F0020062706440645062F06310633064A0646002E")
    Case "help6"
        s = AR("0666002900200642062806440020064306440020062A063A064A064A06310020062A064F062D06410638002006460633062E062900200627062D062A064A06270637064A062900200641064A00200645062C0644062F0020004200610063006B00750070007300200628062C064806270631002006270644064506440641002E00200648064306440020063906450644064A06290020062A064F0633062C064E0651064400200641064A002006480631064206290020004C006F0067002E")
    Case "help7"
        s = AR("0667002900200644062506360627064106290020064106350644003A002006270643062A0628064700200641064A00200628064A062706460627062A005F0627064406410635064806440020002806270644062D062706440629002000AB06460634063700BB00290020062B0645002000AB06250646063406270621002006270644062306480631062706420020062706440646062706420635062900BB002E002006480644062506460647062706260647003A0020063A064A06510631002006270644062D0627")
        s = s & AR("064406290020062506440649002000AB064406440623063106340641062900BB002006230648002000AB06440644062D0630064100BB0020062B0645002006270636063A06370020062706440632063100200627064406450646062706330628002E")
    Case "help8"
        s = AR("066800290020062A0635062F064A0631002006270644062F0631062C0627062A003A002000AB062A062D062F064A062B0020062706440642062706260645062900BB0020219000200627062E062A063100200627064406280644063300202190002000AB062A062D062F064A062F0020064106350648064400200627064406280644063300BB00200028062306480020062D062F0651062F0020064A062F0648064A064B0627002900202190002000AB062A0635062F064A0631002006270644062F0631062C0627")
        s = s & AR("062A00BB002E0020064A064F0641062A062D00200627064406450644064100200627064406460627062A062C00200645064600200645062C0644062F0020004500780070006F007200740073002E")
    Case "help9"
        s = AR("066900290020062506460020063606270639062A002006270644062306320631062706310020062306480020062A063A064A06510631002006270644063406430644003A00200041006C0074002B004600380020062B0645002000530065007400750070002E0020064406270020064A064F06410642062F00200627064406310628063700200648064406270020062706440633062C0644002E")
    Case "helpTitle"
        s = AR("06370631064A0642062900200627064406270633062A062E062F06270645")
    Case "ix1"
        s = AR("062706440648063106420629")
    Case "ix10"
        s = AR("062A06270631064A062E00200627064406230631063406410629")
    Case "ix2"
        s = AR("06270644064106350644")
    Case "ix3"
        s = AR("06270644064606480639")
    Case "ix4"
        s = AR("062706440645062F06310633")
    Case "ix5"
        s = AR("06270644062F064806310629")
    Case "ix6"
        s = AR("06270644062806440633")
    Case "ix7"
        s = AR("062706440628062F0627064A0629")
    Case "ix8"
        s = AR("06270644064606470627064A0629")
    Case "ix9"
        s = AR("06270644064106350644002006270644062A06270644064A")
    Case "lMark"
        s = AR("06390644062706450629")
    Case "lPulses"
        s = AR("06270644062806440633")
    Case "lQuran"
        s = AR("0646064806390020062706440642063106220646")
    Case "lUntil"
        s = AR("06270644062A06390628062606290020062D062A0649")
    Case "lYesNo"
        s = AR("064606390645002F06440627")
    Case "lastRefresh"
        s = AR("0622062E06310020062A062D062F064A062B003A")
    Case "lblFile"
        s = AR("0645064406410020062706440645062F06310633064A0646")
    Case "lblFolder"
        s = AR("062706440645062C0644062F")
    Case "lblVer"
        s = AR("0627064406250635062F06270631")
    Case "listTitle"
        s = AR("064206270626064506290020062706440641063506480644002000280645064600200645064406410020062706440645062F06310633064A06460029")
    Case "logAction"
        s = AR("06270644063906450644064A0629")
    Case "logDetails"
        s = AR("06270644062A064106270635064A0644")
    Case "logTime"
        s = AR("0627064406480642062A")
    Case "logTitle"
        s = AR("0633062C0644002006270644063906450644064A0627062A")
    Case "mArcLocked"
        s = AR("06450644064100200041007200630068006900760065002E0078006C00730078002006450641062A0648062D002006390646062F00200634062E063500200622062E0631002E00200623063A0644064206470020062B0645002006230639062F0020062706440645062D0627064806440629002E")
    Case "mArchived"
        s = AR("062A0645062A0020062306310634064106290020007B006E007D002006410635064400200641064A00200041007200630068006900760065002E0078006C00730078002E")
    Case "mBadFile"
        s = AR("06470630062700200627064406450644064100200644064A063300200645064406410020062E06370629002006270644062A062F0631064A0633002000280627064406250635062F06270631002000330029060C0020062306480020062A064606420635064700200627064406230633064506270621002006270644064506390631065106410629002006270644064506370644064806280629002E")
    Case "mBadNames"
        s = AR("062306330645062706210020064406270020062A06350644062D002006230633064506270621064B0020064406440623064806310627064200200028064406450020062A064F0646063406230029003A")
    Case "mConfirmArchive"
        s = AR("0633062A064F0646064206440020064706300647002006270644064106350648064400200028007B006E007D0029002006250644064900200041007200630068006900760065002E0078006C007300780020062B06450020062A064F062D0630064100200645064600200645064406410020062706440645062F06310633064A0646003A")
    Case "mConfirmDelete"
        s = AR("0633062A064F062D063006410020064706300647002006270644064106350648064400200028007B006E007D002900200646064706270626064A064B06270020062806440627002006230631063406410629003A")
    Case "mContinue"
        s = AR("0645062A0627062806390629061F00200028062A0624062E0630002006460633062E062900200627062D062A064A06270637064A06290020062306480644064B06270029")
    Case "mCreated"
        s = AR("062A06450020062506460634062706210020007B006E007D00200648063106420629002E")
    Case "mDeleted"
        s = AR("062A06450020062D063006410020007B006E007D0020064106350644002E")
    Case "mError"
        s = AR("062D062F062B0020062E0637062300200648064406450020062A0643062A06450644002006270644063906450644064A0629003A")
    Case "mExported"
        s = AR("062A06450020062A0635062F064A06310020007B006E007D002006370627064406280020062506440649003A")
    Case "mFileMissing"
        s = AR("0644064500200623062C062F00200645064406410020062706440645062F06310633064A064600200641064A0020062706440645063306270631003A")
    Case "mFillAll"
        s = AR("064406450020062A062D062F062F00200641063506480644064B062700200641064A00200627064406420627062606450629002E0020064706440020062A0631064A062F002006270644062A0639062806260629002006440643064400200627064406410635064806440020062706440646063406370629061F")
    Case "mFillConfirm"
        s = AR("0633062A064F06390628064E06510623002006270644062A064806270631064A062E002006270644064106270631063A0629002006440639062F062F0020007B006E007D002006410635064400200028007B0075007D0029002E0020064406460020064A064F063A064A064E0651063100200623064A0020062A06270631064A062E002006450633062C064E06510644002E00200645062A0627062806390629061F")
    Case "mFilled"
        s = AR("062A0645062A002006270644062A0639062806260629003A0020007B0064007D0020062A06270631064A062E002006480020007B0065007D00200645064606410630002E002006270644062A064106270635064A064400200641064A002006480631064206290020005200650070006F00720074002E")
    Case "mHealthDone"
        s = AR("06270646062A064706490020062706440641062D0635003A0020007B0065007D0020062E06370623002006480020007B0077007D0020062A06460628064A0647002E002006270644062A064106270635064A064400200641064A002006480631064206290020005200650070006F00720074002E")
    Case "mMissingSheets"
        s = AR("0641063506480644002006280644062700200623064806310627064200200028062A06450020062A062C062706480632064706270029003A")
    Case "mNeedExclusive"
        s = AR("064406270020064A064506430646002006270644062A0639062F064A064400200627064406220646003A002006270644064506440641002006450634062706310643002006230648002006450641062A0648062D002006390646062F00200634062E063500200622062E0631002E0020062306480642064100200627064406450634062706310643062900200648062A06230643062F0020062306460020062706440645062F06310633064A064600200623063A0644064206480647060C0020062B064500200623")
        s = s & AR("0639062F0020062706440645062D0627064806440629002E")
    Case "mNoArchive"
        s = AR("064406270020062A0648062C062F002006410635064806440020062D06270644062A06470627002000AB064406440623063106340641062900BB002E")
    Case "mNoDelete"
        s = AR("064406270020062A0648062C062F002006410635064806440020062D06270644062A06470627002000AB06440644062D0630064100BB002E")
    Case "mNoFile"
        s = AR("064406450020064A064F06310628063700200645064406410020062706440645062F06310633064A0646002006280639062F002E002006270636063A0637002000AB06310628063700200645064406410020062706440645062F06310633064A064600BB002E")
    Case "mNoQuranSel"
        s = AR("062D062F0651062F0020064106350644064B0627002006480627062D062F064B0627002006390644064900200627064406230642064400200645064600200641063506480644002006270644064206310622064600200641064A00200627064406420627062606450629002E")
    Case "mNothingCreate"
        s = AR("064406270020062A0648062C062F002006230648063106270642002006460627064206350629002E002006430644002006270644064106350648064400200627064406460634063706290020064406470627002006230648063106270642002E")
    Case "mPickPulse"
        s = AR("0627062E062A06310020062706440628064406330020062306480644064B06270020002806280639062F0020062A062D062F064A062B002006270644064206270626064506290029002E")
    Case "mPulseSel"
        s = AR("062A06450020062A062D062F064A062F0020007B006E007D0020064106350644002E")
    Case "mSetupDone"
        s = AR("062A06450020062A062C0647064A0632002006440648062D06290020062706440625062F062706310629002E002006270628062F0623002006280640002000AB06310628063700200645064406410020062706440645062F06310633064A064600BB002E")
    Case "missing"
        s = AR("06460627064206350629")
    Case "no"
        s = AR("06440627")
    Case "noSheet"
        s = AR("0028062806440627002006480631064206290029")
    Case "note"
        s = AR("064306440020063906450644064A06290020062A063A064A0651063100200645064406410020062706440645062F06310633064A06460020062A0623062E0630002006420628064406470627002006460633062E062900200627062D062A064A06270637064A062900200641064A00200645062C0644062F0020004200610063006B007500700073060C00200648062A064F0633062C064E0651064400200641064A002006480631064206290020004C006F0067002E")
    Case "oExec"
        s = AR("062A06390628062606290020062706440645064606410630002006270644064106270631063A")
    Case "oPulse"
        s = AR("06270644062806440633")
    Case "oUntil"
        s = AR("06270644062A06390628062606290020062D062A0649")
    Case "optEnd"
        s = AR("062D062A06490020064606470627064A0629002006270644064106350644")
    Case "optToday"
        s = AR("062D062A0649002006270644064A06480645")
    Case "repClass"
        s = AR("06270644064106350644")
    Case "repMsg"
        s = AR("06270644064806350641")
    Case "repSev"
        s = AR("06270644064606480639")
    Case "repTitle"
        s = AR("062A06420631064A0631")
    Case "row"
        s = AR("06350641")
    Case "sec1"
        s = AR("066100290020062706440631062806370020064806270644062A062D062F064A062B")
    Case "sec2"
        s = AR("0662002900200625062F0627063106290020062706440641063506480644")
    Case "sec3"
        s = AR("066300290020062A0639062806260629002006270644062A064806270631064A062E00200627064406460627064206350629")
    Case "sec4"
        s = AR("066400290020062A0635062F064A06310020062F0631062C0627062A0020062706440642063106220646")
    Case "seg"
        s = AR("0645064206370639")
    Case "sevErr"
        s = AR("062E06370623")
    Case "sevInfo"
        s = AR("064506390644064806450629")
    Case "sevWarn"
        s = AR("062A06460628064A0647")
    Case "subtitle"
        s = AR("06440648062D0629002006450633062406480644002006270644062E06370629003A0020062506460634062706210020062706440641063506480644002006480623063106340641062A06470627060C0020062A0639062806260629002006270644062A064806270631064A062E060C00200641062D0635002006270644064506440641060C00200648062A0635062F064A06310020062F0631062C0627062A0020062706440642063106220646002E00200645064406410020062706440645062F06310633064A")
        s = s & AR("0646002006460641063306470020064406270020064A062D062A0648064A002006390644064900200623064A002006430648062F002E")
    Case "title"
        s = AR("0623062F0627062900200625062F0627063106290020062E06370629002006270644062A062F0631064A0633")
    Case "whyNoEnd"
        s = AR("064406450020064A064F06390628064E06510623003A0020064406270020062A0648062C062F002000AB064606470627064A062900200627064406410635064400BB00200028064506370644064806280629002006440644062A06390628062606290020062D062A06490020064606470627064A06290020062706440641063506440029")
    Case "whyNoRow"
        s = AR("064406450020064A064F06390628064E06510623003A0020063A064A0631002006450648062C0648062F00200641064A00200628064A062706460627062A005F062706440641063506480644")
    Case "whyNoSheet"
        s = AR("064406450020064A064F06390628064E06510623003A0020064406270020062A0648062C062F00200648063106420629")
    Case "whyNoStart"
        s = AR("064406450020064A064F06390628064E06510623003A0020064406270020062A0648062C062F002000AB0628062F0627064A062900200627064406410635064400BB")
    Case "yes"
        s = AR("064606390645")
    End Select
    T = s
End Function
