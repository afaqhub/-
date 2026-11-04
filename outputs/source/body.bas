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
