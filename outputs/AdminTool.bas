Attribute VB_Name = "PlanAdmin"
'=========================================================================
' Teaching Plan - Admin Tool  (version 5.0)
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

Private Const APP_VER As String = "5.0"

' ---- teachers file: columns of the class table (named range DB_Classes)
Private Const C_NAME As Long = 1
Private Const C_TYPE As Long = 2
Private Const C_TEACHER As Long = 3
Private Const C_COURSE As Long = 4
Private Const C_PART As Long = 5
Private Const C_START_IN As Long = 6
Private Const C_END_IN As Long = 7
Private Const C_DAY1 As Long = 10
Private Const C_DAY3 As Long = 12
Private Const C_EXAMA As Long = 13
Private Const C_EXAMF As Long = 14
Private Const C_STUD As Long = 15
Private Const C_NEXT As Long = 16
Private Const C_TRANS As Long = 17
Private Const C_STATUS As Long = 18
Private Const C_LASTIN As Long = 18
Private Const C_PREV As Long = 26          ' previous CC class (input)
Private Const C_START As Long = 21        ' effective start (formula)
Private Const C_END As Long = 22          ' effective end (formula)

' ---- lessons sheet layout
Private Const L_R0 As Long = 8
Private Const L_R1 As Long = 67
Private Const L_TOPIC As Long = 4
Private Const L_DATE As Long = 6
Private Const L_EXEC As Long = 7
Private Const L_REVIEW As Long = 8

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
Private Const SH_TRANS As String = "Transfers"
Private Const SH_RESTORE As String = "Restore"
Private Const SH_REPORT As String = "Report"
Private Const SH_LOG As String = "Log"
Private Const SH_LISTS As String = "Lists"
Private Const SH_HELP As String = "Help"
Private Const LR0 As Long = 6          ' first data row of the class list on Panel
Private Const LC As Long = 9           ' first column of the Panel class list (I)
Private Const O_CLS As Long = 1
Private Const O_TEA As Long = 2
Private Const O_TYP As Long = 3
Private Const O_PRT As Long = 4
Private Const O_STA As Long = 5
Private Const O_SHT As Long = 6
Private Const TR0 As Long = 11         ' first data row on Transfers
Private Const RR0 As Long = 13         ' first data row on Restore
Private Const MAXLIST As Long = 600
Private Const IX0 As Long = 4          ' first data row of the archive Index

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
' colours and fonts
'=========================================================================
Private Function cInk() As Long
    cInk = RGB(14, 77, 69)
End Function
Private Function cPri() As Long
    cPri = RGB(23, 105, 94)
End Function
Private Function cGold() As Long
    cGold = RGB(176, 141, 60)
End Function
Private Function cGoldL() As Long
    cGoldL = RGB(243, 231, 198)
End Function
Private Function cSand() As Long
    cSand = RGB(251, 248, 241)
End Function
Private Function cCard() As Long
    cCard = RGB(255, 255, 255)
End Function
Private Function cInput() As Long
    cInput = RGB(255, 247, 224)
End Function
Private Function cTerra() As Long
    cTerra = RGB(156, 61, 36)
End Function
Private Function cSlate() As Long
    cSlate = RGB(84, 104, 99)
End Function
Private Function cDone() As Long
    cDone = RGB(215, 236, 223)
End Function
Private Function cLine() As Long
    cLine = RGB(217, 210, 195)
End Function
Private Function FontAr() As String
    FontAr = "Sakkal Majalla"
End Function

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
    ' true for a date, a positive serial number, or text readable as a date
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

Private Function ListVal(ByVal col As Long, ByVal i As Long) As String
    ListVal = Txt(ThisWorkbook.Worksheets(SH_LISTS).Cells(i + 1, col).Value)
End Function

Private Function FindSheet(wb As Workbook, ByVal nm As String) As Worksheet
    Dim ws As Worksheet
    If Len(nm) = 0 Then Exit Function
    For Each ws In wb.Worksheets
        If StrComp(ws.Name, nm, vbTextCompare) = 0 Then
            Set FindSheet = ws
            Exit Function
        End If
    Next ws
End Function

Private Function FindRow(dbr As Range, ByVal nm As String) As Long
    Dim r As Long
    If Len(nm) = 0 Then Exit Function
    For r = 2 To dbr.Rows.Count
        If StrComp(Txt(dbr.Cells(r, C_NAME).Value), nm, vbTextCompare) = 0 Then
            FindRow = r
            Exit Function
        End If
    Next r
End Function

Private Function FirstEmptyRow(dbr As Range) As Long
    Dim r As Long
    For r = 2 To dbr.Rows.Count
        If Len(Txt(dbr.Cells(r, C_NAME).Value)) = 0 Then
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

Private Function SameText(ByVal a As String, ByVal b As String) As Boolean
    SameText = (StrComp(a, b, vbTextCompare) = 0)
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

Private Sub ShowError()
    Dim d As String
    d = Err.Description
    EndWork
    MsgBox T("mError") & vbLf & d, vbCritical
End Sub

Private Sub Status(ByVal s As String)
    Application.StatusBar = s
End Sub

'=========================================================================
' teachers file: locate, open, close, backup, log
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

Private Function TargetFolder() As String
    TargetFolder = FSO.GetParentFolderName(TargetPath())
End Function

Private Function OpenBook(ByVal p As String, ByVal forWrite As Boolean, ByRef wasOpen As Boolean) As Workbook
    Dim w As Workbook, wb As Workbook
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
    Set OpenBook = wb
End Function

Private Function OpenTarget(ByVal forWrite As Boolean, ByRef wasOpen As Boolean) As Workbook
    Dim p As String, wb As Workbook
    p = TargetPath()
    If Len(p) = 0 Then
        MsgBox T("mNoFile"), vbExclamation
        Exit Function
    End If
    If Not FSO.FileExists(p) Then
        MsgBox T("mFileMissing") & vbLf & p, vbExclamation
        Exit Function
    End If
    Set wb = OpenBook(p, forWrite, wasOpen)
    If Not HasName(wb, "DB_Classes") Or Not HasName(wb, "LST_Status") Or Not HasName(wb, "TPL_Quran") Then
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
        UnlockBook wb
    End If
    Set OpenTarget = wb
End Function

Private Sub CloseBook(wb As Workbook, ByVal wasOpen As Boolean, ByVal doSave As Boolean)
    If wb Is Nothing Then Exit Sub
    If HasName(wb, "DB_Classes") Then LockBook wb
    If doSave Then wb.Save
    If Not wasOpen Then wb.Close SaveChanges:=False
End Sub

Private Sub BackupBook(wb As Workbook)
    Dim fld As String
    fld = FSO.GetParentFolderName(wb.FullName) & "\Backups"
    If Not FSO.FolderExists(fld) Then FSO.CreateFolder fld
    wb.SaveCopyAs fld & "\" & Format(Now, "yyyymmdd_hhnnss") & "_" & wb.Name
End Sub

Private Sub WriteLog(ByVal action As String, ByVal details As String)
    Dim ws As Worksheet, r As Long
    Set ws = ThisWorkbook.Worksheets(SH_LOG)
    r = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row + 1
    If r < 4 Then r = 4
    ws.Cells(r, 2).Value = Now
    ws.Cells(r, 2).NumberFormat = "yyyy/mm/dd hh:mm"
    ws.Cells(r, 3).Value = action
    ws.Cells(r, 4).Value = Left$(Replace(details, vbLf, "  |  "), 30000)
    ws.Range(ws.Cells(r, 2), ws.Cells(r, 4)).Borders.Color = cLine()
End Sub

Private Sub UnlockBook(wb As Workbook)
    On Error Resume Next
    wb.Unprotect
    On Error GoTo 0
End Sub

Private Sub LockBook(wb As Workbook)
    On Error Resume Next
    wb.Protect Structure:=True, Windows:=False
    On Error GoTo 0
End Sub

Private Sub ClearClassRow(d As Range, ByVal r As Long)
    ClearClassRow d, r
    d.Cells(r, C_PREV).ClearContents
End Sub

Private Function DB(wb As Workbook) As Range
    Set DB = wb.Names("DB_Classes").RefersToRange
End Function

'=========================================================================
' report sheet
'=========================================================================
Private Sub RepStart(ByVal title As String)
    Set mRep = ThisWorkbook.Worksheets(SH_REPORT)
    mRep.Range("B5:D" & mRep.Rows.Count).Clear
    mRep.Range("B3").Value = title & "   " & Format(Now, "yyyy/mm/dd hh:nn")
    mRepRow = 5
    mErr = 0
    mWarn = 0
End Sub

Private Sub Rep(ByVal sev As Long, ByVal cls As String, ByVal msg As String)
    With mRep
        .Cells(mRepRow, 2).Value = Choose(sev, T("sevErr"), T("sevWarn"), T("sevInfo"))
        .Cells(mRepRow, 2).Interior.Color = Choose(sev, RGB(246, 213, 200), RGB(252, 239, 199), RGB(215, 236, 223))
        .Cells(mRepRow, 3).NumberFormat = "@"
        .Cells(mRepRow, 3).Value = cls
        .Cells(mRepRow, 4).Value = msg
        With .Range(.Cells(mRepRow, 2), .Cells(mRepRow, 4))
            .Borders.Color = cLine()
            .Font.Name = FontAr()
            .Font.Size = 13
            .VerticalAlignment = xlCenter
        End With
        .Cells(mRepRow, 2).HorizontalAlignment = xlCenter
        .Cells(mRepRow, 3).HorizontalAlignment = xlCenter
    End With
    If sev = 1 Then mErr = mErr + 1
    If sev = 2 Then mWarn = mWarn + 1
    mRepRow = mRepRow + 1
End Sub

'=========================================================================
' SETUP : builds the whole control panel inside this workbook
'=========================================================================
Public Sub Setup()
    Dim keep(1 To 5) As String, nms As Variant, i As Long
    nms = Array("CFG_File", "CFG_FillUntil", "CFG_FillExec", "CFG_AfterTrans", "CFG_Pulse")
    On Error Resume Next
    For i = 1 To 5
        keep(i) = Txt(ThisWorkbook.Names(nms(i - 1)).RefersToRange.Value)
    Next i
    Err.Clear
    On Error GoTo EH
    BeginWork
    BuildLists
    BuildPanel
    BuildTransfers
    BuildRestore
    BuildReport
    BuildLog
    BuildHelp
    RemoveEmptySheets
    CfgCell("CFG_File").Value = keep(1)
    If Len(keep(1)) > 0 Then CfgCell("CFG_Folder").Value = TargetFolder()
    CfgCell("CFG_FillUntil").Value = IIf(Len(keep(2)) > 0, keep(2), ListVal(1, 1))
    CfgCell("CFG_FillExec").Value = IIf(Len(keep(3)) > 0, keep(3), ListVal(2, 1))
    CfgCell("CFG_AfterTrans").Value = IIf(Len(keep(4)) > 0, keep(4), ListVal(7, 1))
    CfgCell("CFG_Pulse").Value = keep(5)
    OrderSheets
    ThisWorkbook.Worksheets(SH_PANEL).Activate
    ThisWorkbook.Worksheets(SH_PANEL).Range("A1").Select
    EndWork
    MsgBox T("mSetupDone"), vbInformation
    Exit Sub
EH:
    ShowError
End Sub

Private Sub OrderSheets()
    Dim i As Long, nm As Variant
    i = 0
    For Each nm In Array(SH_PANEL, SH_TRANS, SH_RESTORE, SH_REPORT, SH_LOG, SH_HELP, SH_LISTS)
        i = i + 1
        ThisWorkbook.Worksheets(CStr(nm)).Move After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count)
    Next nm
    ThisWorkbook.Worksheets(SH_PANEL).Tab.Color = cInk()
    ThisWorkbook.Worksheets(SH_TRANS).Tab.Color = cGold()
    ThisWorkbook.Worksheets(SH_RESTORE).Tab.Color = cGold()
    ThisWorkbook.Worksheets(SH_REPORT).Tab.Color = cPri()
    ThisWorkbook.Worksheets(SH_LOG).Tab.Color = cSlate()
    ThisWorkbook.Worksheets(SH_HELP).Tab.Color = cPri()
    ThisWorkbook.Worksheets(SH_LISTS).Tab.Color = RGB(160, 160, 160)
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
            Case SH_PANEL, SH_TRANS, SH_RESTORE, SH_REPORT, SH_LOG, SH_LISTS, SH_HELP
            Case Else
                If Application.WorksheetFunction.CountA(ws.Cells) = 0 And ws.Shapes.Count = 0 Then ws.Delete
        End Select
    Next i
End Sub

Private Sub ResetSheet(ws As Worksheet, ByVal clearAll As Boolean)
    Dim i As Long
    ws.Activate
    For i = ws.Shapes.Count To 1 Step -1
        ws.Shapes(i).Delete
    Next i
    If clearAll Then
        ws.Cells.Clear
        ws.Cells.Validation.Delete
    End If
    ws.DisplayRightToLeft = True
    ws.Cells.Font.Name = FontAr()
    ws.Cells.Font.Size = 14
    ws.Cells.Interior.Color = cSand()
    ActiveWindow.DisplayGridlines = False
    ActiveWindow.DisplayHeadings = False
    ws.Columns("A").ColumnWidth = 2
    ws.Columns("B").ColumnWidth = 18
    ws.Columns("C").ColumnWidth = 18
    ws.Columns("D").ColumnWidth = 24
    ws.Columns("E").ColumnWidth = 13
    ws.Columns("F").ColumnWidth = 13
    ws.Columns("G").ColumnWidth = 15
    ws.Columns("H").ColumnWidth = 16
    ws.Columns("I").ColumnWidth = 2
End Sub

Private Sub TitleBlock(ws As Worksheet, ByVal title As String, ByVal subtitle As String)
    With ws.Range("B1:H1")
        .Merge
        .Value = title
        .Font.Size = 26
        .Font.Bold = True
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = cInk()
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
        .Borders(xlEdgeBottom).Color = cGold()
        .Borders(xlEdgeBottom).Weight = xlThick
    End With
    ws.Rows(1).RowHeight = 54
    With ws.Range("B2:H2")
        .Merge
        .Value = subtitle
        .WrapText = True
        .Font.Size = 13
        .Font.Color = RGB(90, 90, 90)
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
    End With
    ws.Rows(2).RowHeight = 40
End Sub

Private Sub StyleHeader(rg As Range)
    rg.Font.Bold = True
    rg.Font.Size = 14
    rg.Font.Color = RGB(255, 255, 255)
    rg.Interior.Color = cInk()
    rg.HorizontalAlignment = xlCenter
    rg.VerticalAlignment = xlCenter
    rg.WrapText = True
    rg.Borders.Color = cLine()
    rg.Borders(xlEdgeBottom).Color = cGold()
    rg.Borders(xlEdgeBottom).Weight = xlMedium
End Sub

Private Sub SectionRow(ws As Worksheet, ByVal r As Long, ByVal caption As String)
    With ws.Range(ws.Cells(r, 2), ws.Cells(r, 8))
        .Merge
        .Value = caption
        .Font.Bold = True
        .Font.Size = 17
        .Font.Color = cInk()
        .Interior.Color = cGoldL()
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
        .Borders(xlEdgeBottom).Color = cGold()
        .Borders(xlEdgeBottom).Weight = xlMedium
    End With
    ws.Rows(r).RowHeight = 32
End Sub

Private Sub DescCell(ws As Worksheet, ByVal r As Long, ByVal desc As String)
    With ws.Range(ws.Cells(r, 4), ws.Cells(r, 8))
        .Merge
        .Value = desc
        .WrapText = True
        .VerticalAlignment = xlCenter
        .HorizontalAlignment = xlRight
        .IndentLevel = 1
        .Font.Size = 13
        .Font.Color = RGB(70, 70, 70)
        .Interior.Color = cCard()
        .Borders(xlEdgeBottom).Color = cLine()
    End With
End Sub

Private Sub ButtonRow(ws As Worksheet, ByVal r As Long, ByVal cap As String, ByVal macro As String, _
                      ByVal desc As String, ByVal clr As Long, Optional ByVal h As Double = 50)
    Dim rg As Range, shp As Shape
    ws.Rows(r).RowHeight = h
    Set rg = ws.Range(ws.Cells(r, 2), ws.Cells(r, 3))
    rg.Interior.Color = cCard()
    rg.Borders(xlEdgeBottom).Color = cLine()
    Set shp = ws.Shapes.AddShape(5, rg.Left + 6, rg.Top + 5, rg.Width - 12, rg.Height - 10)
    shp.Name = "btn_" & macro
    shp.Fill.ForeColor.RGB = clr
    shp.Line.Visible = -1
    shp.Line.ForeColor.RGB = cGold()
    shp.Line.Weight = 1.25
    On Error Resume Next
    shp.Adjustments.Item(1) = 0.3
    shp.Shadow.Visible = -1
    shp.Shadow.OffsetX = 1
    shp.Shadow.OffsetY = 2
    shp.Shadow.Transparency = 0.75
    On Error GoTo 0
    With shp.TextFrame2
        .TextRange.Text = cap
        .TextRange.Font.Name = FontAr()
        .TextRange.Font.Size = 16
        .TextRange.Font.Bold = -1
        .TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextRange.ParagraphFormat.Alignment = 2
        .VerticalAnchor = 3
        .WordWrap = -1
        .MarginLeft = 2
        .MarginRight = 2
    End With
    On Error Resume Next
    shp.TextFrame2.TextRange.Font.NameComplexScript = FontAr()
    shp.TextFrame2.TextRange.ParagraphFormat.TextDirection = 2
    On Error GoTo 0
    shp.OnAction = macro
    shp.Placement = 2
    DescCell ws, r, desc
End Sub

Private Sub OptionRow(ws As Worksheet, ByVal r As Long, ByVal lbl As String, ByVal nm As String, _
                      ByVal listRef As String, ByVal desc As String)
    ws.Rows(r).RowHeight = 40
    With ws.Cells(r, 2)
        .Value = lbl
        .Font.Bold = True
        .Font.Color = cInk()
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
        .Interior.Color = cCard()
        .Borders(xlEdgeBottom).Color = cLine()
    End With
    With ws.Cells(r, 3)
        .Interior.Color = cInput()
        .Borders.Color = cGold()
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
        .Font.Bold = True
        .Font.Color = cInk()
        .WrapText = True
        .Validation.Delete
        .Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="=" & listRef
    End With
    ThisWorkbook.Names.Add Name:=nm, RefersTo:="='" & ws.Name & "'!" & ws.Cells(r, 3).Address
    DescCell ws, r, desc
End Sub

Private Sub ListHeader(ws As Worksheet, ByVal r As Long, ByVal title As String, heads As Variant)
    Dim i As Long
    With ws.Range(ws.Cells(r - 1, 2), ws.Cells(r - 1, 8))
        .Merge
        .Value = title
        .Font.Bold = True
        .Font.Size = 17
        .Font.Color = cInk()
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
    End With
    ws.Rows(r - 1).RowHeight = 32
    For i = LBound(heads) To UBound(heads)
        ws.Cells(r, 2 + i - LBound(heads)).Value = heads(i)
    Next i
    StyleHeader ws.Range(ws.Cells(r, 2), ws.Cells(r, 2 + UBound(heads) - LBound(heads)))
    ws.Rows(r).RowHeight = 30
End Sub

Private Sub PrepareTable(ws As Worksheet, ByVal r0 As Long, ByVal nCols As Long, ByVal markCol As Boolean, _
                         Optional ByVal firstCol As Long = 2)
    Dim rg As Range
    Set rg = ws.Range(ws.Cells(r0, firstCol), ws.Cells(r0 + MAXLIST, firstCol + nCols - 1))
    rg.Clear
    rg.Interior.Color = cSand()
    rg.Font.Name = FontAr()
    rg.Font.Size = 13
    rg.NumberFormat = "@"
    rg.HorizontalAlignment = xlCenter
    rg.VerticalAlignment = xlCenter
    If markCol Then
        With ws.Range(ws.Cells(r0, firstCol), ws.Cells(r0 + MAXLIST, firstCol))
            .Validation.Delete
            .Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="='" & SH_LISTS & "'!$D$2"
            .Font.Bold = True
            .Font.Size = 16
            .Font.Color = cPri()
        End With
    End If
End Sub

Private Sub StyleRow(ws As Worksheet, ByVal r As Long, ByVal nCols As Long, ByVal markCol As Boolean, _
                     Optional ByVal firstCol As Long = 2)
    With ws.Range(ws.Cells(r, firstCol), ws.Cells(r, firstCol + nCols - 1))
        .Interior.Color = IIf((r Mod 2) = 0, cCard(), RGB(247, 242, 232))
        .Borders.Color = cLine()
    End With
    If markCol Then ws.Cells(r, firstCol).Interior.Color = cInput()
End Sub

Private Sub BuildLists()
    Dim ws As Worksheet
    Set ws = GetSheet(SH_LISTS)
    ws.Cells.Clear
    ws.DisplayRightToLeft = True
    ws.Cells.Font.Name = FontAr()
    ws.Cells(1, 1).Value = T("lUntil"):  ws.Cells(2, 1).Value = T("optToday"): ws.Cells(3, 1).Value = T("optEnd")
    ws.Cells(1, 2).Value = T("lYesNo"):  ws.Cells(2, 2).Value = T("yes"):      ws.Cells(3, 2).Value = T("no")
    ws.Cells(1, 3).Value = T("lPulses")
    ws.Cells(1, 4).Value = T("lMark"):   ws.Cells(2, 4).Value = CK()
    ws.Cells(1, 5).Value = T("lQuran")
    ws.Cells(1, 6).Value = T("lArcPulses")
    ws.Cells(1, 7).Value = T("lAfter"):  ws.Cells(2, 7).Value = T("optKeep"):  ws.Cells(3, 7).Value = T("optArchive")
    StyleHeader ws.Range("A1:G1")
    ws.Columns("A:G").ColumnWidth = 22
    ws.Range("C2:C500").NumberFormat = "@"
    ws.Range("F2:F500").NumberFormat = "@"
End Sub

Private Sub SectionBar(ws As Worksheet, ByVal r As Long, ByVal caption As String)
    With ws.Range(ws.Cells(r, 2), ws.Cells(r, 7))
        .Merge
        .Value = caption
        .Font.Bold = True
        .Font.Size = 15
        .Font.Color = cInk()
        .Interior.Color = cGoldL()
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
        .Borders(xlEdgeBottom).Color = cGold()
        .Borders(xlEdgeBottom).Weight = xlMedium
    End With
    ws.Rows(r).RowHeight = 26
End Sub

' a card = big button over two rows + a one-line caption under it (slot 0..2 across columns B:G)
Private Sub Card(ws As Worksheet, ByVal r As Long, ByVal slot As Long, ByVal cap As String, ByVal macro As String, _
                 ByVal subTxt As String, ByVal clr As Long)
    Dim c1 As Long, rg As Range, shp As Shape
    c1 = 2 + slot * 2
    Set rg = ws.Range(ws.Cells(r, c1), ws.Cells(r + 1, c1 + 1))
    rg.Interior.Color = cCard()
    Set shp = ws.Shapes.AddShape(5, rg.Left + 5, rg.Top + 4, rg.Width - 10, rg.Height - 6)
    shp.Name = "btn_" & macro
    shp.Fill.ForeColor.RGB = clr
    shp.Line.Visible = -1
    shp.Line.ForeColor.RGB = cGold()
    shp.Line.Weight = 1.25
    On Error Resume Next
    shp.Adjustments.Item(1) = 0.25
    shp.Shadow.Visible = -1
    shp.Shadow.OffsetX = 1
    shp.Shadow.OffsetY = 2
    shp.Shadow.Transparency = 0.75
    On Error GoTo 0
    With shp.TextFrame2
        .TextRange.Text = cap
        .TextRange.Font.Name = FontAr()
        .TextRange.Font.Size = 16
        .TextRange.Font.Bold = -1
        .TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .TextRange.ParagraphFormat.Alignment = 2
        .VerticalAnchor = 3
        .WordWrap = -1
        .MarginLeft = 2
        .MarginRight = 2
    End With
    On Error Resume Next
    shp.TextFrame2.TextRange.Font.NameComplexScript = FontAr()
    shp.TextFrame2.TextRange.ParagraphFormat.TextDirection = 2
    On Error GoTo 0
    shp.OnAction = macro
    shp.Placement = 2
    CardCaption ws, r + 2, c1, subTxt
End Sub

Private Sub CardCaption(ws As Worksheet, ByVal r As Long, ByVal c1 As Long, ByVal subTxt As String)
    With ws.Range(ws.Cells(r, c1), ws.Cells(r, c1 + 1))
        .Merge
        .Value = subTxt
        .WrapText = True
        .Font.Size = 11
        .Font.Color = RGB(95, 95, 95)
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlTop
        .Interior.Color = cCard()
        .Borders(xlEdgeBottom).Color = cLine()
    End With
End Sub

' an option card = label row + dropdown row + caption row
Private Sub OptionCard(ws As Worksheet, ByVal r As Long, ByVal slot As Long, ByVal lbl As String, ByVal nm As String, _
                       ByVal listRef As String, ByVal subTxt As String)
    Dim c1 As Long
    c1 = 2 + slot * 2
    With ws.Range(ws.Cells(r, c1), ws.Cells(r, c1 + 1))
        .Merge
        .Value = lbl
        .Font.Bold = True
        .Font.Size = 13
        .Font.Color = cInk()
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
        .Interior.Color = cCard()
    End With
    With ws.Range(ws.Cells(r + 1, c1), ws.Cells(r + 1, c1 + 1))
        .Merge
        .Interior.Color = cInput()
        .Borders.Color = cGold()
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
        .Font.Bold = True
        .Font.Size = 14
        .Font.Color = cInk()
    End With
    With ws.Cells(r + 1, c1)
        .Validation.Delete
        .Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="=" & listRef
    End With
    ThisWorkbook.Names.Add Name:=nm, RefersTo:="='" & ws.Name & "'!" & ws.Cells(r + 1, c1).Address
    CardCaption ws, r + 2, c1, subTxt
End Sub

Private Sub CardRows(ws As Worksheet, ByVal r As Long)
    ws.Rows(r).RowHeight = 24
    ws.Rows(r + 1).RowHeight = 24
    ws.Rows(r + 2).RowHeight = 30
End Sub

Private Sub BuildPanel()
    Dim ws As Worksheet, i As Long
    Set ws = GetSheet(SH_PANEL)
    ResetSheet ws, True
    ActiveWindow.Zoom = 90
    For i = 2 To 7
        ws.Columns(i).ColumnWidth = 15
    Next i
    ws.Columns("H").ColumnWidth = 3
    ws.Columns("I").ColumnWidth = 7
    ws.Columns("J").ColumnWidth = 15
    ws.Columns("K").ColumnWidth = 16
    ws.Columns("L").ColumnWidth = 9
    ws.Columns("M").ColumnWidth = 9
    ws.Columns("N").ColumnWidth = 11
    ws.Columns("O").ColumnWidth = 8
    ws.Columns("P").ColumnWidth = 2

    With ws.Range("B1:O1")
        .Merge
        .Value = T("title")
        .Font.Size = 24
        .Font.Bold = True
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = cInk()
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
        .Borders(xlEdgeBottom).Color = cGold()
        .Borders(xlEdgeBottom).Weight = xlThick
    End With
    ws.Rows(1).RowHeight = 46
    ws.Range("B2").Value = T("lblFile")
    ws.Range("I2").Value = T("lblFolder")
    ws.Range("C2:G2").Merge
    ws.Range("J2:O2").Merge
    With ws.Range("B2,I2")
        .Font.Bold = True
        .Font.Color = cInk()
        .HorizontalAlignment = xlCenter
        .Interior.Color = cGoldL()
    End With
    With ws.Range("C2:G2,J2:O2")
        .Interior.Color = cCard()
        .Borders.Color = cLine()
        .HorizontalAlignment = xlRight
        .IndentLevel = 1
        .ShrinkToFit = True
    End With
    ws.Range("C2").Font.Bold = True
    ws.Range("C2").Font.Color = cInk()
    ws.Range("J2").Font.Size = 11
    ws.Range("J2").Font.Color = RGB(110, 110, 110)
    ws.Rows(2).RowHeight = 26
    ws.Rows(3).RowHeight = 6
    ThisWorkbook.Names.Add Name:="CFG_File", RefersTo:="='" & SH_PANEL & "'!$C$2"
    ThisWorkbook.Names.Add Name:="CFG_Folder", RefersTo:="='" & SH_PANEL & "'!$J$2"

    SectionBar ws, 4, T("sec1")
    CardRows ws, 5
    Card ws, 5, 0, T("bLink"), "BtnLinkFile", T("cLink"), cInk()
    Card ws, 5, 1, T("bRefresh"), "BtnRefresh", T("cRefresh"), cInk()
    Card ws, 5, 2, T("bHealth"), "BtnHealth", T("cHealth"), cSlate()

    SectionBar ws, 8, T("sec2")
    CardRows ws, 9
    Card ws, 9, 0, T("bCreate"), "BtnCreateSheets", T("cCreate"), cPri()
    Card ws, 9, 1, T("bTrans"), "BtnTransitions", T("cTrans"), cPri()
    OptionCard ws, 9, 2, T("oAfter"), "CFG_AfterTrans", "'" & SH_LISTS & "'!$G$2:$G$3", T("cAfter")
    CardRows ws, 12
    Card ws, 12, 0, T("bArchive"), "BtnArchive", T("cArchive"), cGold()
    Card ws, 12, 1, T("bDelete"), "BtnDelete", T("cDelete"), cTerra()
    Card ws, 12, 2, T("bGoRestore"), "BtnGoRestore", T("cGoRestore"), cGold()
    CardRows ws, 15
    Card ws, 15, 0, T("bShowAdmin"), "BtnShowAdmin", T("cShowAdmin"), cSlate()
    Card ws, 15, 1, T("bHideAdmin"), "BtnHideAdmin", T("cHideAdmin"), cSlate()
    Card ws, 15, 2, T("bFollow"), "BtnFollowUp", T("cFollow"), cPri()

    SectionBar ws, 18, T("sec3")
    CardRows ws, 19
    OptionCard ws, 19, 0, T("oUntil"), "CFG_FillUntil", "'" & SH_LISTS & "'!$A$2:$A$3", T("cUntil")
    OptionCard ws, 19, 1, T("oExec"), "CFG_FillExec", "'" & SH_LISTS & "'!$B$2:$B$3", T("cExec")
    Card ws, 19, 2, T("bFill"), "BtnFillDates", T("cFill"), cPri()

    SectionBar ws, 22, T("sec4")
    CardRows ws, 23
    OptionCard ws, 23, 0, T("oPulse"), "CFG_Pulse", "'" & SH_LISTS & "'!$C$2:$C$200", T("cPulse")
    Card ws, 23, 1, T("bSelPulse"), "BtnSelectPulse", T("cSelPulse"), cInk()
    Card ws, 23, 2, T("bSelAll"), "BtnSelectAll", T("cSelAll"), cSlate()
    CardRows ws, 26
    Card ws, 26, 0, T("bClear"), "BtnClearSel", T("cClear"), cSlate()
    Card ws, 26, 1, T("bExport"), "BtnExport", T("cExport"), cPri()
    Card ws, 26, 2, T("bGoTrans"), "BtnGoTransfers", T("cGoTrans"), cGold()

    SectionBar ws, 29, T("sec5")
    CardRows ws, 30
    Card ws, 30, 0, T("bImport"), "BtnImportOld", T("cImport"), cSlate()
    Card ws, 30, 1, T("bHelp"), "BtnGoHelp", T("cHelp"), cInk()
    CardCaption ws, 32, 6, ""
    ws.Range(ws.Cells(30, 6), ws.Cells(31, 7)).Interior.Color = cCard()
    With ws.Range(ws.Cells(30, 6), ws.Cells(31, 7))
        .Merge
        .Value = T("note")
        .WrapText = True
        .Font.Size = 11
        .Font.Italic = True
        .Font.Color = RGB(100, 100, 100)
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
    End With
    ws.Range("B33").Value = T("lblVer") & " " & APP_VER
    ws.Range("B33").Font.Size = 10
    ws.Range("B33").Font.Color = RGB(150, 150, 150)

    ' class list on the right
    With ws.Range(ws.Cells(LR0 - 2, LC), ws.Cells(LR0 - 2, LC + 6))
        .Merge
        .Value = T("listTitle")
        .Font.Bold = True
        .Font.Size = 15
        .Font.Color = cInk()
        .Interior.Color = cGoldL()
        .HorizontalAlignment = xlRight
        .VerticalAlignment = xlCenter
        .IndentLevel = 1
        .Borders(xlEdgeBottom).Color = cGold()
        .Borders(xlEdgeBottom).Weight = xlMedium
    End With
    ws.Cells(LR0 - 1, LC).Value = T("hSel")
    ws.Cells(LR0 - 1, LC + O_CLS).Value = T("hClass")
    ws.Cells(LR0 - 1, LC + O_TEA).Value = T("hTeacher")
    ws.Cells(LR0 - 1, LC + O_TYP).Value = T("hType")
    ws.Cells(LR0 - 1, LC + O_PRT).Value = T("hPart")
    ws.Cells(LR0 - 1, LC + O_STA).Value = T("hStatus")
    ws.Cells(LR0 - 1, LC + O_SHT).Value = T("hSheet")
    StyleHeader ws.Range(ws.Cells(LR0 - 1, LC), ws.Cells(LR0 - 1, LC + 6))
    PrepareTable ws, LR0, 7, True, LC
    ws.Range("A1").Select
End Sub

Public Sub BtnGoHelp()
    ThisWorkbook.Worksheets(SH_HELP).Activate
End Sub

'=========================================================================
' BUTTONS: show / hide the admin sheets inside the teachers' file
'=========================================================================
Public Sub BtnShowAdmin()
    SetAdminVisible True
End Sub

Public Sub BtnHideAdmin()
    SetAdminVisible False
End Sub

Private Sub SetAdminVisible(ByVal makeVisible As Boolean)
    Dim wb As Workbook, wasOpen As Boolean, n As Object, ws As Worksheet, dash As Worksheet, cnt As Long
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set dash = wb.Names("SYS_Dash").RefersToRange.Worksheet
    dash.Visible = xlSheetVisible
    For Each n In wb.Names
        If Left$(n.Name, 4) = "SYS_" Or Left$(n.Name, 4) = "TPL_" Then
            Set ws = Nothing
            On Error Resume Next
            Set ws = n.RefersToRange.Worksheet
            On Error GoTo EH
            If Not ws Is Nothing Then
                If Not ws Is dash Then
                    If makeVisible Then
                        ws.Visible = xlSheetVisible
                    Else
                        ws.Visible = xlSheetHidden
                    End If
                    cnt = cnt + 1
                End If
            End If
        End If
    Next n
    dash.Activate
    CloseBook wb, wasOpen, True
    EndWork
    WriteLog IIf(makeVisible, T("bShowAdmin"), T("bHideAdmin")), CStr(cnt)
    MsgBox IIf(makeVisible, T("mShown"), T("mHidden")), vbInformation
    Exit Sub
EH:
    ShowError
End Sub

Private Sub BuildTransfers()
    Dim ws As Worksheet
    Set ws = GetSheet(SH_TRANS)
    ResetSheet ws, True
    TitleBlock ws, T("trTitle"), T("trSub")
    ButtonRow ws, 4, T("bLoadStud"), "BtnLoadStudents", T("dLoadStud"), cInk(), 62
    ButtonRow ws, 5, T("bExecTr"), "BtnExecTransfers", T("dExecTr"), cPri(), 78
    ButtonRow ws, 6, T("bClearTr"), "BtnClearTransfers", T("dClearTr"), cSlate(), 40
    ButtonRow ws, 7, T("bBack"), "BtnGoPanel", T("dBack"), cGold(), 40
    ListHeader ws, TR0 - 1, T("trList"), Array(T("hId"), T("hCur"), T("hName"), T("hNew"), T("hResult"))
    ws.Range(ws.Cells(TR0 - 1, 6), ws.Cells(TR0 - 1, 8)).Merge
    PrepareTable ws, TR0, 7, False
    ws.Range(ws.Cells(TR0, 5), ws.Cells(TR0 + MAXLIST, 5)).Interior.Color = cInput()
    ws.Range(ws.Cells(TR0, 5), ws.Cells(TR0 + MAXLIST, 5)).Font.Bold = True
End Sub

Private Sub BuildRestore()
    Dim ws As Worksheet
    Set ws = GetSheet(SH_RESTORE)
    ResetSheet ws, True
    TitleBlock ws, T("rsTitle"), T("rsSub")
    ButtonRow ws, 4, T("bLoadArc"), "BtnLoadArchive", T("dLoadArc"), cInk()
    OptionRow ws, 5, T("oPulse"), "CFG_RPulse", "'" & SH_LISTS & "'!$F$2:$F$200", T("dRPulse")
    ButtonRow ws, 6, T("bSelPulse"), "BtnSelectArcPulse", T("dSelArcPulse"), cInk(), 40
    ButtonRow ws, 7, T("bClear"), "BtnClearArcSel", T("dClear"), cSlate(), 40
    ButtonRow ws, 8, T("bRestore"), "BtnRestore", T("dRestore"), cPri(), 78
    ButtonRow ws, 9, T("bBack"), "BtnGoPanel", T("dBack"), cGold(), 40
    ListHeader ws, RR0 - 1, T("rsList"), Array(T("hSel"), T("hClass"), T("hTeacher"), T("hType"), T("hPart"), T("hArcDate"), T("hArcSheet"))
    PrepareTable ws, RR0, 7, True
End Sub

Private Sub BuildReport()
    Dim ws As Worksheet
    Set ws = GetSheet(SH_REPORT)
    ResetSheet ws, True
    TitleBlock ws, T("repTitle"), ""
    ws.Rows(2).RowHeight = 8
    ws.Range("B3:H3").Merge
    ws.Range("B3").Font.Bold = True
    ws.Range("B3").Font.Color = cInk()
    ws.Range("B3").HorizontalAlignment = xlRight
    ws.Range("B4").Value = T("repSev")
    ws.Range("C4").Value = T("repClass")
    ws.Range("D4").Value = T("repMsg")
    StyleHeader ws.Range("B4:D4")
    ws.Columns("B").ColumnWidth = 11
    ws.Columns("C").ColumnWidth = 18
    ws.Columns("D").ColumnWidth = 110
End Sub

Private Sub BuildLog()
    Dim ws As Worksheet
    Set ws = GetSheet(SH_LOG)
    ResetSheet ws, False
    TitleBlock ws, T("logTitle"), ""
    ws.Rows(2).RowHeight = 8
    ws.Range("B3").Value = T("logTime")
    ws.Range("C3").Value = T("logAction")
    ws.Range("D3").Value = T("logDetails")
    StyleHeader ws.Range("B3:D3")
    ws.Columns("B").ColumnWidth = 18
    ws.Columns("C").ColumnWidth = 20
    ws.Columns("D").ColumnWidth = 110
End Sub

Private Sub BuildHelp()
    Dim ws As Worksheet, i As Long
    Set ws = GetSheet(SH_HELP)
    ResetSheet ws, True
    TitleBlock ws, T("helpTitle"), ""
    ws.Rows(2).RowHeight = 8
    ws.Range("B3:H3").Merge
    For i = 1 To 14
        With ws.Range(ws.Cells(i + 2, 2), ws.Cells(i + 2, 8))
            .Merge
            .Value = T("help" & i)
            .WrapText = True
            .VerticalAlignment = xlCenter
            .HorizontalAlignment = xlRight
            .IndentLevel = 1
            .Interior.Color = IIf((i Mod 2) = 0, cCard(), RGB(247, 242, 232))
            .Borders(xlEdgeBottom).Color = cLine()
        End With
        ws.Rows(i + 2).RowHeight = 46
    Next i
End Sub

'=========================================================================
' navigation
'=========================================================================
Public Sub BtnGoPanel()
    ThisWorkbook.Worksheets(SH_PANEL).Activate
End Sub

Public Sub BtnGoTransfers()
    ThisWorkbook.Worksheets(SH_TRANS).Activate
End Sub

Public Sub BtnGoRestore()
    ThisWorkbook.Worksheets(SH_RESTORE).Activate
End Sub

'=========================================================================
' BUTTON: link teachers file
'=========================================================================
Public Sub BtnLinkFile()
    Dim fd As Object, p As String
    On Error GoTo EH
    p = PickFile(T("dlgPick"))
    If Len(p) = 0 Then Exit Sub
    If SameText(FSO.GetParentFolderName(p), ThisWorkbook.Path) Then
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

Private Function PickFile(ByVal title As String) As String
    Dim fd As Object
    Set fd = Application.FileDialog(3)
    With fd
        .Title = title
        .AllowMultiSelect = False
        .InitialFileName = ThisWorkbook.Path & "\"
        .Filters.Clear
        .Filters.Add "Excel", "*.xlsx;*.xlsm;*.xls"
        If .Show = -1 Then PickFile = .SelectedItems(1)
    End With
End Function

'=========================================================================
' BUTTON: refresh class list
'=========================================================================
Public Sub BtnRefresh()
    Dim wb As Workbook, wasOpen As Boolean, d As Range, ws As Worksheet
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
    Set d = DB(wb)
    qLbl = LV(wb, "LST_Type", 2)
    PrepareTable ws, LR0, 7, True, LC
    Set pul = CreateObject("Scripting.Dictionary")
    pul.CompareMode = 1
    For r = 2 To d.Rows.Count
        nm = Txt(d.Cells(r, C_NAME).Value)
        If Len(nm) > 0 And n < MAXLIST Then
            i = LR0 + n
            StyleRow ws, i, 7, True, LC
            If sel.Exists(nm) Then ws.Cells(i, LC).Value = CK()
            ws.Cells(i, LC + O_CLS).Value = nm
            ws.Cells(i, LC + O_CLS).Font.Bold = True
            ws.Cells(i, LC + O_TEA).Value = Txt(d.Cells(r, C_TEACHER).Value)
            ws.Cells(i, LC + O_TYP).Value = Txt(d.Cells(r, C_TYPE).Value)
            pt = Txt(d.Cells(r, C_PART).Value)
            ws.Cells(i, LC + O_PRT).Value = pt
            ws.Cells(i, LC + O_STA).Value = Txt(d.Cells(r, C_STATUS).Value)
            If FindSheet(wb, nm) Is Nothing Then
                ws.Cells(i, LC + O_SHT).Value = T("missing")
                ws.Cells(i, LC + O_SHT).Font.Color = cTerra()
            Else
                ws.Cells(i, LC + O_SHT).Value = CK()
                ws.Cells(i, LC + O_SHT).Font.Color = cPri()
            End If
            ws.Cells(i, LC + O_SHT).Font.Bold = True
            If SameText(ws.Cells(i, LC + O_TYP).Value, qLbl) Then
                ws.Cells(i, LC + O_TYP).Interior.Color = cGoldL()
            End If
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
    CloseBook wb, wasOpen, False
    ws.Cells(LR0 - 2, LC).Value = T("listTitle") & "   (" & n & ")   " & T("lastRefresh") & " " & Format(Now, "yyyy/mm/dd hh:nn")
    EndWork
    Exit Sub
EH:
    ShowError
End Sub

Private Function MarkedIn(ByVal shName As String, ByVal r0 As Long, ByVal keyCol As Long) As Collection
    Dim c As New Collection, ws As Worksheet, r As Long, mc As Long
    Set ws = ThisWorkbook.Worksheets(shName)
    mc = IIf(shName = SH_PANEL, LC, 2)
    r = r0
    Do While Len(Txt(ws.Cells(r, keyCol).Value)) > 0
        If Txt(ws.Cells(r, mc).Value) = CK() Then c.Add Txt(ws.Cells(r, keyCol).Value)
        r = r + 1
    Loop
    Set MarkedIn = c
End Function

Private Function Selected() As Collection
    Set Selected = MarkedIn(SH_PANEL, LR0, LC + O_CLS)
End Function

Private Function MarkByValue(ByVal shName As String, ByVal r0 As Long, ByVal keyCol As Long, ByVal valCol As Long, _
                             ByVal v As String) As Long
    Dim ws As Worksheet, r As Long, n As Long, mc As Long
    Set ws = ThisWorkbook.Worksheets(shName)
    mc = IIf(shName = SH_PANEL, LC, 2)
    r = r0
    Do While Len(Txt(ws.Cells(r, keyCol).Value)) > 0
        If SameText(Txt(ws.Cells(r, valCol).Value), v) Then
            ws.Cells(r, mc).Value = CK()
            n = n + 1
        Else
            ws.Cells(r, mc).ClearContents
        End If
        r = r + 1
    Loop
    MarkByValue = n
End Function

Public Sub BtnSelectPulse()
    Dim p As String
    p = Txt(CfgCell("CFG_Pulse").Value)
    If Len(p) = 0 Then
        MsgBox T("mPickPulse"), vbExclamation
        Exit Sub
    End If
    MsgBox Replace(T("mPulseSel"), "{n}", CStr(MarkByValue(SH_PANEL, LR0, LC + O_CLS, LC + O_PRT, p))), vbInformation
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
    With ThisWorkbook.Worksheets(SH_PANEL)
        .Range(.Cells(LR0, LC), .Cells(LR0 + MAXLIST, LC)).ClearContents
    End With
End Sub

'=========================================================================
' class creation helpers
'=========================================================================
Private Function LastVisibleSheet(wb As Workbook) As Worksheet
    Dim i As Long
    For i = wb.Worksheets.Count To 1 Step -1
        If wb.Worksheets(i).Visible = xlSheetVisible Then
            Set LastVisibleSheet = wb.Worksheets(i)
            Exit Function
        End If
    Next i
    Set LastVisibleSheet = wb.Worksheets(1)
End Function

Private Sub CopyTemplate(wb As Workbook, ByVal tplName As String, ByVal newName As String)
    Dim tpl As Worksheet, ws As Worksheet
    Set tpl = wb.Names(tplName).RefersToRange.Worksheet
    tpl.Copy After:=LastVisibleSheet(wb)
    Set ws = wb.ActiveSheet
    ws.Name = newName
    ws.Visible = xlSheetVisible
    If tplName = "TPL_Quran" Then
        ws.Tab.Color = cGold()
    Else
        ws.Tab.Color = cPri()
    End If
End Sub

Private Function EnsureSheet(wb As Workbook, d As Range, ByVal r As Long, ByVal tQ As String) As Worksheet
    Dim nm As String
    nm = Txt(d.Cells(r, C_NAME).Value)
    Set EnsureSheet = FindSheet(wb, nm)
    If Not EnsureSheet Is Nothing Then Exit Function
    If Not ValidSheetName(nm) Then Exit Function
    If SameText(Txt(d.Cells(r, C_TYPE).Value), tQ) Then
        CopyTemplate wb, "TPL_Quran", nm
    Else
        CopyTemplate wb, "TPL_Lessons", nm
    End If
    Set EnsureSheet = FindSheet(wb, nm)
End Function

' registers the planned next (specialisation) class of row r; returns its row (0 = none)
Private Function EnsureNextRow(d As Range, ByVal r As Long, ByVal tL As String, ByVal sAct As String, ByRef added As Boolean) As Long
    Dim nx As String, rr As Long, c As Long
    added = False
    nx = Txt(d.Cells(r, C_NEXT).Value)
    If Len(nx) = 0 Then Exit Function
    rr = FindRow(d, nx)
    If rr > 0 Then
        EnsureNextRow = rr
        Exit Function
    End If
    rr = FirstEmptyRow(d)
    If rr = 0 Then Exit Function
    d.Cells(rr, C_NAME).Value = nx
    d.Cells(rr, C_TYPE).Value = tL
    d.Cells(rr, C_TEACHER).Value = d.Cells(r, C_TEACHER).Value
    d.Cells(rr, C_COURSE).Value = d.Cells(r, C_COURSE).Value
    d.Cells(rr, C_PART).Value = d.Cells(r, C_PART).Value
    If HasDateVal(d.Cells(r, C_TRANS).Value) Then d.Cells(rr, C_START_IN).Value = d.Cells(r, C_TRANS).Value
    For c = C_DAY1 To C_DAY3
        d.Cells(rr, c).Value = d.Cells(r, c).Value
    Next c
    d.Cells(rr, C_STATUS).Value = sAct
    d.Cells(rr, C_PREV).Value = d.Cells(r, C_NAME).Value
    added = True
    EnsureNextRow = rr
End Function

'=========================================================================
' BUTTON: create missing sheets (+ planned next classes)
'=========================================================================
Public Sub BtnCreateSheets()
    Dim wb As Workbook, wasOpen As Boolean, d As Range, sh As Worksheet
    Dim r As Long, n As Long, nm As String, st As String, added As Boolean
    Dim sAct As String, tL As String, tQ As String, made As String, bad As String
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set d = DB(wb)
    sAct = LV(wb, "LST_Status", 1)
    tL = LV(wb, "LST_Type", 1)
    tQ = LV(wb, "LST_Type", 2)
    BackupBook wb
    For r = 2 To d.Rows.Count
        nm = Txt(d.Cells(r, C_NAME).Value)
        st = Txt(d.Cells(r, C_STATUS).Value)
        If Len(nm) > 0 And IsActiveStatus(st, sAct) Then
            EnsureNextRow d, r, tL, sAct, added
            If added Then made = made & vbLf & "  + " & Txt(d.Cells(r, C_NEXT).Value) & "   (" & T("fromCC") & " " & nm & ")"
        End If
    Next r
    For r = 2 To d.Rows.Count
        nm = Txt(d.Cells(r, C_NAME).Value)
        st = Txt(d.Cells(r, C_STATUS).Value)
        If Len(nm) > 0 And IsActiveStatus(st, sAct) Then
            If FindSheet(wb, nm) Is Nothing Then
                Set sh = EnsureSheet(wb, d, r, tQ)
                If sh Is Nothing Then
                    bad = bad & vbLf & "  ! " & nm
                Else
                    n = n + 1
                    If InStr(made, "+ " & nm & "   (") = 0 Then made = made & vbLf & "  + " & nm
                End If
            End If
        End If
    Next r
    wb.Worksheets(1).Activate
    Application.Calculate
    CloseBook wb, wasOpen, (n > 0 Or Len(made) > 0)
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

'=========================================================================
' BUTTON: process due CC -> specialisation transitions
'=========================================================================
Public Sub BtnTransitions()
    Dim wb As Workbook, wasOpen As Boolean, d As Range, r As Long, rr As Long, i As Long
    Dim sAct As String, sFin As String, tL As String, tQ As String, nm As String, added As Boolean
    Dim due As New Collection, dueRows As New Collection, arcN As New Collection, arcR As New Collection
    Dim toArchive As Boolean, msg As String, sh As Worksheet, nArc As Long
    On Error GoTo EH
    toArchive = SameText(Txt(CfgCell("CFG_AfterTrans").Value), ListVal(7, 2))
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set d = DB(wb)
    sAct = LV(wb, "LST_Status", 1)
    sFin = LV(wb, "LST_Status", 4)
    tL = LV(wb, "LST_Type", 1)
    tQ = LV(wb, "LST_Type", 2)
    For r = 2 To d.Rows.Count
        nm = Txt(d.Cells(r, C_NAME).Value)
        If Len(nm) > 0 And Len(Txt(d.Cells(r, C_NEXT).Value)) > 0 And IsActiveStatus(Txt(d.Cells(r, C_STATUS).Value), sAct) Then
            If HasDateVal(d.Cells(r, C_TRANS).Value) Then
                If CDate(d.Cells(r, C_TRANS).Value) <= Date Then
                    due.Add nm & "  " & ChrW(&H2190) & "  " & Txt(d.Cells(r, C_NEXT).Value)
                    dueRows.Add r
                End If
            End If
        End If
    Next r
    If due.Count = 0 Then
        CloseBook wb, wasOpen, False
        EndWork
        MsgBox T("mNoTrans"), vbInformation
        Exit Sub
    End If
    msg = Replace(T("mConfirmTrans"), "{n}", CStr(due.Count)) & ShortList(due) & vbLf & vbLf & _
          IIf(toArchive, T("mTransArc"), T("mTransKeep")) & vbLf & vbLf & T("mContinue")
    Application.ScreenUpdating = True
    If MsgBox(msg, vbYesNo + vbQuestion + vbDefaultButton2) <> vbYes Then
        CloseBook wb, wasOpen, False
        EndWork
        Exit Sub
    End If
    Application.ScreenUpdating = False
    BackupBook wb
    For i = 1 To dueRows.Count
        r = dueRows(i)
        rr = EnsureNextRow(d, r, tL, sAct, added)
        If rr > 0 Then
            d.Cells(rr, C_STATUS).Value = sAct
            Set sh = EnsureSheet(wb, d, rr, tQ)
        End If
        If toArchive Then
            arcN.Add Txt(d.Cells(r, C_NAME).Value)
            arcR.Add r
        Else
            d.Cells(r, C_STATUS).Value = sFin
        End If
    Next i
    If arcN.Count > 0 Then nArc = ArchiveRows(wb, d, arcN, arcR)
    wb.Worksheets(1).Activate
    Application.Calculate
    CloseBook wb, wasOpen, True
    EndWork
    WriteLog T("aTrans"), CStr(due.Count) & ShortList(due)
    MsgBox Replace(T("mTransDone"), "{n}", CStr(due.Count)) & IIf(nArc > 0, vbLf & Replace(T("mArchived"), "{n}", CStr(nArc)), ""), vbInformation
    BtnRefresh
    Exit Sub
EH:
    ShowError
End Sub

'=========================================================================
' archive core (shared by archive button and transitions)
'=========================================================================
Private Function ArchivePath(wb As Workbook) As String
    ArchivePath = FSO.GetParentFolderName(wb.FullName) & "\Archive.xlsx"
End Function

Private Function OpenArchive(ByVal p As String, ByVal createIfMissing As Boolean, ByVal forWrite As Boolean, _
                             ByRef wasOpen As Boolean, d As Range) As Workbook
    Dim wb As Workbook, ws As Worksheet
    If Not FSO.FileExists(p) Then
        For Each wb In Application.Workbooks
            If SameText(wb.FullName, p) Then
                Set OpenArchive = wb
                wasOpen = True
                Exit Function
            End If
        Next wb
        If Not createIfMissing Then Exit Function
        Set wb = Application.Workbooks.Add(xlWBATWorksheet)
        Set ws = wb.Worksheets(1)
        ws.Name = "Index"
        BuildIndexHeader ws, d
        wb.SaveAs Filename:=p, FileFormat:=51
        wasOpen = False
        Set OpenArchive = wb
        Exit Function
    End If
    Set wb = OpenBook(p, forWrite, wasOpen)
    If forWrite And wb.ReadOnly Then
        MsgBox T("mArcLocked"), vbExclamation
        If Not wasOpen Then wb.Close SaveChanges:=False
        Exit Function
    End If
    If FindSheet(wb, "Index") Is Nothing Then
        If Not forWrite Then
            If Not wasOpen Then wb.Close SaveChanges:=False
            Exit Function
        End If
        Set ws = wb.Worksheets.Add(Before:=wb.Worksheets(1))
        ws.Name = "Index"
        BuildIndexHeader ws, d
    End If
    Set OpenArchive = wb
End Function

Private Sub BuildIndexHeader(ws As Worksheet, d As Range)
    Dim c As Long
    ws.DisplayRightToLeft = True
    ws.Cells.Font.Name = FontAr()
    ws.Cells.Font.Size = 13
    With ws.Range("A1:J1")
        .Merge
        .Value = T("arcTitle")
        .Font.Size = 24
        .Font.Bold = True
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = cInk()
        .HorizontalAlignment = xlRight
        .IndentLevel = 1
        .Borders(xlEdgeBottom).Color = cGold()
        .Borders(xlEdgeBottom).Weight = xlThick
    End With
    ws.Rows(1).RowHeight = 46
    ws.Range("A2").Value = T("arcNote")
    ws.Range("A2").Font.Color = RGB(100, 100, 100)
    ws.Cells(3, 1).Value = T("ixSheet")
    For c = 1 To C_LASTIN
        ws.Cells(3, 1 + c).Value = d.Cells(1, c).Value
    Next c
    ws.Cells(3, C_LASTIN + 2).Value = T("ixDate")
    ws.Cells(3, C_LASTIN + 3).Value = T("ixRestored")
    ws.Cells(3, C_LASTIN + 4).Value = d.Cells(1, C_PREV).Value
    StyleHeader ws.Range(ws.Cells(3, 1), ws.Cells(3, C_LASTIN + 4))
    ws.Rows(3).RowHeight = 40
    ws.Columns(1).ColumnWidth = 18
    ws.Columns(2).ColumnWidth = 16
    ws.Range(ws.Columns(3), ws.Columns(C_LASTIN + 4)).ColumnWidth = 12
    ws.Activate
    ActiveWindow.FreezePanes = False
    ws.Range("C4").Select
    ActiveWindow.FreezePanes = True
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

Private Sub ValueizeSheet(ws As Worksheet)
    Dim c As Range
    Unprot ws
    For Each c In ws.UsedRange.Cells
        If c.HasFormula Then c.Value = c.Value
    Next c
    ws.Cells.Validation.Delete
End Sub

Private Function CopyToArchive(src As Worksheet, arc As Workbook, ByVal nm As String) As String
    Dim ws As Worksheet, nn As String
    src.Copy After:=arc.Worksheets(arc.Worksheets.Count)
    Set ws = arc.Worksheets(arc.Worksheets.Count)
    ValueizeSheet ws
    ws.Range("A3").Value = nm
    ws.Range("E1").Value = T("archivedOn") & " " & Format(Date, "yyyy/mm/dd")
    ws.Range("A1").Value = T("backIndex")
    ws.Hyperlinks.Add Anchor:=ws.Range("A1"), Address:="", SubAddress:="'Index'!A1", TextToDisplay:=T("backIndex")
    nn = UniqueName(arc, nm, ws)
    If ws.Name <> nn Then ws.Name = nn
    ws.Tab.Color = RGB(160, 160, 160)
    Prot ws
    CopyToArchive = nn
End Function

Private Sub AddIndexRow(arc As Workbook, d As Range, ByVal r As Long, ByVal shName As String)
    Dim ws As Worksheet, i As Long, c As Long
    Set ws = arc.Worksheets("Index")
    i = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row + 1
    If i < IX0 Then i = IX0
    If Len(shName) > 0 Then
        ws.Hyperlinks.Add Anchor:=ws.Cells(i, 1), Address:="", SubAddress:="'" & shName & "'!A1", TextToDisplay:=shName
    Else
        ws.Cells(i, 1).Value = T("noSheet")
    End If
    For c = 1 To C_LASTIN
        ws.Cells(i, 1 + c).NumberFormat = d.Cells(r, c).NumberFormat
        ws.Cells(i, 1 + c).Value = d.Cells(r, c).Value
    Next c
    ws.Cells(i, 2).NumberFormat = "@"
    ws.Cells(i, 2).Value = Txt(d.Cells(r, C_NAME).Value)
    ws.Cells(i, C_LASTIN + 2).Value = Date
    ws.Cells(i, C_LASTIN + 2).NumberFormat = "yyyy/mm/dd"
    ws.Cells(i, C_LASTIN + 4).Value = d.Cells(r, C_PREV).Value
    With ws.Range(ws.Cells(i, 1), ws.Cells(i, C_LASTIN + 4))
        .Borders.Color = cLine()
        .HorizontalAlignment = xlCenter
        .Interior.Color = IIf((i Mod 2) = 0, cCard(), RGB(247, 242, 232))
    End With
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

' archives the given classes (names + their DB rows); returns how many were archived
Private Function ArchiveRows(wb As Workbook, d As Range, lst As Collection, rowsC As Collection) As Long
    Dim arc As Workbook, arcWasOpen As Boolean, i As Long, r As Long, nm As String, src As Worksheet, shName As String
    Set arc = OpenArchive(ArchivePath(wb), True, True, arcWasOpen, d)
    If arc Is Nothing Then Exit Function
    BackupBook arc
    For i = 1 To lst.Count
        nm = lst(i)
        r = rowsC(i)
        Status T("aArchive") & ": " & nm
        Set src = FindSheet(wb, nm)
        shName = ""
        If Not src Is Nothing Then shName = CopyToArchive(src, arc, nm)
        AddIndexRow arc, d, r, shName
        If Not src Is Nothing Then src.Delete
        ClearClassRow d, r
        ArchiveRows = ArchiveRows + 1
    Next i
    BreakExternal arc
    arc.Worksheets("Index").Activate
    arc.Save
    If Not arcWasOpen Then arc.Close SaveChanges:=False
End Function

Private Sub CollectByStatus(d As Range, ByVal st As String, lst As Collection, rowsC As Collection)
    Dim r As Long, nm As String
    For r = 2 To d.Rows.Count
        nm = Txt(d.Cells(r, C_NAME).Value)
        If Len(nm) > 0 And SameText(Txt(d.Cells(r, C_STATUS).Value), st) Then
            lst.Add nm
            rowsC.Add r
        End If
    Next r
End Sub

'=========================================================================
' BUTTON: archive classes marked for archiving
'=========================================================================
Public Sub BtnArchive()
    Dim wb As Workbook, wasOpen As Boolean, d As Range, n As Long
    Dim lst As New Collection, rowsC As New Collection
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set d = DB(wb)
    CollectByStatus d, LV(wb, "LST_Status", 2), lst, rowsC
    If lst.Count = 0 Then
        CloseBook wb, wasOpen, False
        EndWork
        MsgBox T("mNoArchive"), vbInformation
        Exit Sub
    End If
    Application.ScreenUpdating = True
    If MsgBox(Replace(T("mConfirmArchive"), "{n}", CStr(lst.Count)) & ShortList(lst) & vbLf & vbLf & T("mContinue"), _
              vbYesNo + vbQuestion + vbDefaultButton2) <> vbYes Then
        CloseBook wb, wasOpen, False
        EndWork
        Exit Sub
    End If
    Application.ScreenUpdating = False
    BackupBook wb
    n = ArchiveRows(wb, d, lst, rowsC)
    wb.Worksheets(1).Activate
    Application.Calculate
    CloseBook wb, wasOpen, True
    EndWork
    WriteLog T("aArchive"), CStr(n) & ShortList(lst)
    MsgBox Replace(T("mArchived"), "{n}", CStr(n)), vbInformation
    BtnRefresh
    Exit Sub
EH:
    ShowError
End Sub

'=========================================================================
' BUTTON: delete classes marked for deletion
'=========================================================================
Public Sub BtnDelete()
    Dim wb As Workbook, wasOpen As Boolean, d As Range, r As Long, n As Long, i As Long, src As Worksheet
    Dim lst As New Collection, rowsC As New Collection
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set d = DB(wb)
    CollectByStatus d, LV(wb, "LST_Status", 3), lst, rowsC
    If lst.Count = 0 Then
        CloseBook wb, wasOpen, False
        EndWork
        MsgBox T("mNoDelete"), vbInformation
        Exit Sub
    End If
    Application.ScreenUpdating = True
    If MsgBox(Replace(T("mConfirmDelete"), "{n}", CStr(lst.Count)) & ShortList(lst) & vbLf & vbLf & T("mContinue"), _
              vbYesNo + vbExclamation + vbDefaultButton2) <> vbYes Then
        CloseBook wb, wasOpen, False
        EndWork
        Exit Sub
    End If
    Application.ScreenUpdating = False
    BackupBook wb
    For i = 1 To lst.Count
        Set src = FindSheet(wb, CStr(lst(i)))
        If Not src Is Nothing Then src.Delete
        r = rowsC(i)
        ClearClassRow d, r
        n = n + 1
    Next i
    wb.Worksheets(1).Activate
    Application.Calculate
    CloseBook wb, wasOpen, True
    EndWork
    WriteLog T("aDelete"), CStr(n) & ShortList(lst)
    MsgBox Replace(T("mDeleted"), "{n}", CStr(n)), vbInformation
    BtnRefresh
    Exit Sub
EH:
    ShowError
End Sub

'=========================================================================
' RESTORE FROM ARCHIVE
'=========================================================================
Public Sub BtnLoadArchive()
    Dim wb As Workbook, wasOpen As Boolean, arc As Workbook, arcWasOpen As Boolean, ix As Worksheet, ws As Worksheet
    Dim r As Long, n As Long, i As Long, last As Long, pt As String, pul As Object, k As Variant
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(False, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set arc = OpenArchive(ArchivePath(wb), False, False, arcWasOpen, DB(wb))
    If arc Is Nothing Then
        CloseBook wb, wasOpen, False
        EndWork
        MsgBox T("mNoArcFile"), vbInformation
        Exit Sub
    End If
    Set ix = arc.Worksheets("Index")
    Set ws = ThisWorkbook.Worksheets(SH_RESTORE)
    PrepareTable ws, RR0, 7, True
    Set pul = CreateObject("Scripting.Dictionary")
    pul.CompareMode = 1
    last = ix.Cells(ix.Rows.Count, 2).End(xlUp).Row
    For r = IX0 To last
        If Len(Txt(ix.Cells(r, 2).Value)) > 0 And Len(Txt(ix.Cells(r, C_LASTIN + 3).Value)) = 0 Then
            i = RR0 + n
            StyleRow ws, i, 7, True
            ws.Cells(i, 3).Value = Txt(ix.Cells(r, 1 + C_NAME).Value)
            ws.Cells(i, 3).Font.Bold = True
            ws.Cells(i, 4).Value = Txt(ix.Cells(r, 1 + C_TEACHER).Value)
            ws.Cells(i, 5).Value = Txt(ix.Cells(r, 1 + C_TYPE).Value)
            pt = Txt(ix.Cells(r, 1 + C_PART).Value)
            ws.Cells(i, 6).Value = pt
            If HasDateVal(ix.Cells(r, C_LASTIN + 2).Value) Then ws.Cells(i, 7).Value = Format(CDate(ix.Cells(r, C_LASTIN + 2).Value), "yyyy/mm/dd")
            ws.Cells(i, 8).Value = Txt(ix.Cells(r, 1).Value)
            If Len(pt) > 0 Then pul(pt) = True
            n = n + 1
        End If
    Next r
    With ThisWorkbook.Worksheets(SH_LISTS)
        .Range("F2:F500").ClearContents
        i = 2
        For Each k In pul.Keys
            .Cells(i, 6).Value = k
            i = i + 1
        Next k
    End With
    If Not arcWasOpen Then arc.Close SaveChanges:=False
    CloseBook wb, wasOpen, False
    ws.Cells(RR0 - 2, 2).Value = T("rsList") & "   (" & n & ")   " & T("lastRefresh") & " " & Format(Now, "yyyy/mm/dd hh:nn")
    EndWork
    ws.Activate
    Exit Sub
EH:
    ShowError
End Sub

Public Sub BtnSelectArcPulse()
    Dim p As String
    p = Txt(CfgCell("CFG_RPulse").Value)
    If Len(p) = 0 Then
        MsgBox T("mPickPulse"), vbExclamation
        Exit Sub
    End If
    MsgBox Replace(T("mPulseSel"), "{n}", CStr(MarkByValue(SH_RESTORE, RR0, 3, 6, p))), vbInformation
End Sub

Public Sub BtnClearArcSel()
    With ThisWorkbook.Worksheets(SH_RESTORE)
        .Range(.Cells(RR0, 2), .Cells(RR0 + MAXLIST, 2)).ClearContents
    End With
End Sub

Public Sub BtnRestore()
    Dim wb As Workbook, wasOpen As Boolean, arc As Workbook, arcWasOpen As Boolean, ix As Worksheet, d As Range
    Dim sel As Collection, ws As Worksheet, r As Long, i As Long, ixr As Long, rr As Long, c As Long, last As Long
    Dim arcName As String, nm As String, tQ As String, sAct As String, src As Worksheet, dst As Worksheet
    Dim nOk As Long, isQ As Boolean
    On Error GoTo EH
    Set ws = ThisWorkbook.Worksheets(SH_RESTORE)
    Set sel = New Collection
    r = RR0
    Do While Len(Txt(ws.Cells(r, 3).Value)) > 0
        If Txt(ws.Cells(r, 2).Value) = CK() Then sel.Add r
        r = r + 1
    Loop
    If sel.Count = 0 Then
        MsgBox T("mNoRestoreSel"), vbExclamation
        Exit Sub
    End If
    If MsgBox(Replace(T("mConfirmRestore"), "{n}", CStr(sel.Count)) & vbLf & vbLf & T("mContinue"), _
              vbYesNo + vbQuestion + vbDefaultButton2) <> vbYes Then Exit Sub
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set d = DB(wb)
    tQ = LV(wb, "LST_Type", 2)
    sAct = LV(wb, "LST_Status", 1)
    Set arc = OpenArchive(ArchivePath(wb), False, True, arcWasOpen, d)
    If arc Is Nothing Then
        CloseBook wb, wasOpen, False
        EndWork
        MsgBox T("mNoArcFile"), vbExclamation
        Exit Sub
    End If
    Set ix = arc.Worksheets("Index")
    BackupBook wb
    BackupBook arc
    RepStart T("bRestore")
    last = ix.Cells(ix.Rows.Count, 2).End(xlUp).Row
    For i = 1 To sel.Count
        r = sel(i)
        nm = Txt(ws.Cells(r, 3).Value)
        arcName = Txt(ws.Cells(r, 8).Value)
        Status T("bRestore") & ": " & nm
        ixr = 0
        For c = IX0 To last
            If SameText(Txt(ix.Cells(c, 1 + C_NAME).Value), nm) And SameText(Txt(ix.Cells(c, 1).Value), arcName) _
               And Len(Txt(ix.Cells(c, C_LASTIN + 3).Value)) = 0 Then
                ixr = c
                Exit For
            End If
        Next c
        If ixr = 0 Then
            Rep 1, nm, T("rsNotInIndex")
        ElseIf FindRow(d, nm) > 0 Then
            Rep 1, nm, T("rsExistsRow")
        ElseIf Not FindSheet(wb, nm) Is Nothing Then
            Rep 1, nm, T("rsExistsSheet")
        Else
            rr = FirstEmptyRow(d)
            If rr = 0 Then
                Rep 1, nm, T("rsNoRoom")
            Else
                For c = 1 To C_LASTIN
                    d.Cells(rr, c).Value = ix.Cells(ixr, 1 + c).Value
                Next c
                d.Cells(rr, C_NAME).Value = nm
                d.Cells(rr, C_STATUS).Value = sAct
                d.Cells(rr, C_PREV).Value = ix.Cells(ixr, C_LASTIN + 4).Value
                isQ = SameText(Txt(d.Cells(rr, C_TYPE).Value), tQ)
                Set dst = EnsureSheet(wb, d, rr, tQ)
                Set src = FindSheet(arc, arcName)
                If dst Is Nothing Then
                    Rep 1, nm, T("hcBadName")
                Else
                    If Not src Is Nothing Then
                        Application.Calculate
                        RestoreInputs src, dst, isQ
                        Application.DisplayAlerts = False
                        src.Delete
                    Else
                        Rep 2, nm, T("rsNoSheet")
                    End If
                    ix.Cells(ixr, C_LASTIN + 3).Value = T("restoredOn") & " " & Format(Date, "yyyy/mm/dd")
                    ix.Range(ix.Cells(ixr, 1), ix.Cells(ixr, C_LASTIN + 3)).Font.Color = RGB(150, 150, 150)
                    Rep 3, nm, T("rsDone")
                    nOk = nOk + 1
                End If
            End If
        End If
    Next i
    arc.Worksheets("Index").Activate
    arc.Save
    If Not arcWasOpen Then arc.Close SaveChanges:=False
    wb.Worksheets(1).Activate
    Application.Calculate
    CloseBook wb, wasOpen, (nOk > 0)
    EndWork
    WriteLog T("bRestore"), CStr(nOk)
    MsgBox Replace(T("mRestored"), "{n}", CStr(nOk)) & IIf(mErr > 0, vbLf & T("mSeeReport"), ""), vbInformation
    BtnLoadArchive
    BtnRefresh
    Exit Sub
EH:
    ShowError
End Sub

' copies only the input cells back; formulas come from the fresh template copy
Private Sub RestoreInputs(src As Worksheet, dst As Worksheet, ByVal isQ As Boolean)
    Dim c As Long, a As String, b As String
    Unprot dst
    If isQ Then
        For c = Q_C0 To Q_C1
            a = Txt(src.Cells(Q_RLABEL, c).Value)
            b = Txt(dst.Cells(Q_RLABEL, c).Value)
            If Len(a) > 0 And Not SameText(a, b) Then dst.Cells(Q_RLABEL, c).Value = a
        Next c
        CopyVals src, dst, src.Range(src.Cells(Q_RDATE, Q_C0), src.Cells(Q_REXEC, Q_C1))
        CopyVals src, dst, src.Range(src.Cells(Q_S0, Q_ID), src.Cells(Q_S1, Q_SNAME))
        CopyVals src, dst, src.Range(src.Cells(Q_S0, Q_C0), src.Cells(Q_S1, Q_C1))
    Else
        CopyVals src, dst, src.Range(src.Cells(L_R0, L_DATE), src.Cells(L_R1, L_REVIEW))
    End If
    Prot dst
End Sub

Private Sub CopyVals(src As Worksheet, dst As Worksheet, rg As Range)
    Dim v As Variant, i As Long, j As Long, cell As Range
    v = rg.Value
    For i = 1 To rg.Rows.Count
        For j = 1 To rg.Columns.Count
            If Len(Txt(v(i, j))) > 0 Then
                Set cell = dst.Cells(rg.Row + i - 1, rg.Column + j - 1)
                If Not cell.HasFormula Then cell.Value = v(i, j)
            End If
        Next j
    Next i
End Sub

'=========================================================================
' STUDENT TRANSFERS (Quran classes)
'=========================================================================
Public Sub BtnClearTransfers()
    PrepareTable ThisWorkbook.Worksheets(SH_TRANS), TR0, 7, False
    With ThisWorkbook.Worksheets(SH_TRANS)
        .Range(.Cells(TR0, 5), .Cells(TR0 + MAXLIST, 5)).Interior.Color = cInput()
        .Range(.Cells(TR0, 5), .Cells(TR0 + MAXLIST, 5)).Font.Bold = True
    End With
End Sub

Public Sub BtnLoadStudents()
    Dim wb As Workbook, wasOpen As Boolean, d As Range, ws As Worksheet, sh As Worksheet
    Dim lst As Collection, nm As Variant, r As Long, k As Long, i As Long, n As Long, tQ As String
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
    Set d = DB(wb)
    tQ = LV(wb, "LST_Type", 2)
    Set ws = ThisWorkbook.Worksheets(SH_TRANS)
    BtnClearTransfers
    For Each nm In lst
        k = FindRow(d, CStr(nm))
        If k > 0 Then
            If SameText(Txt(d.Cells(k, C_TYPE).Value), tQ) Then
                Set sh = FindSheet(wb, CStr(nm))
                If Not sh Is Nothing Then
                    For r = Q_S0 To Q_S1
                        If Len(Txt(sh.Cells(r, Q_ID).Value)) > 0 Then
                            i = TR0 + n
                            StyleRow ws, i, 7, False
                            ws.Cells(i, 5).Interior.Color = cInput()
                            ws.Cells(i, 2).Value = Txt(sh.Cells(r, Q_ID).Value)
                            ws.Cells(i, 3).Value = CStr(nm)
                            ws.Cells(i, 4).Value = Txt(sh.Cells(r, Q_SNAME).Value)
                            ws.Cells(i, 4).HorizontalAlignment = xlLeft
                            n = n + 1
                        End If
                    Next r
                End If
            End If
        End If
    Next nm
    CloseBook wb, wasOpen, False
    EndWork
    ws.Activate
    MsgBox Replace(T("mStudLoaded"), "{n}", CStr(n)), vbInformation
    Exit Sub
EH:
    ShowError
End Sub

Private Function FreeStudentRow(sh As Worksheet) As Long
    Dim r As Long
    For r = Q_S0 To Q_S1
        If Len(Txt(sh.Cells(r, Q_ID).Value)) = 0 And Len(Txt(sh.Cells(r, Q_SNAME).Value)) = 0 Then
            FreeStudentRow = r
            Exit Function
        End If
    Next r
End Function

Private Function FindStudent(wb As Workbook, d As Range, ByVal tQ As String, ByVal id As String, ByVal hint As String, _
                             ByRef rowOut As Long) As Worksheet
    Dim sh As Worksheet, r As Long, k As Long
    If Len(hint) > 0 Then
        Set sh = FindSheet(wb, hint)
        If Not sh Is Nothing Then
            For r = Q_S0 To Q_S1
                If SameText(Txt(sh.Cells(r, Q_ID).Value), id) Then
                    rowOut = r
                    Set FindStudent = sh
                    Exit Function
                End If
            Next r
        End If
    End If
    For k = 2 To d.Rows.Count
        If Len(Txt(d.Cells(k, C_NAME).Value)) > 0 And SameText(Txt(d.Cells(k, C_TYPE).Value), tQ) Then
            Set sh = FindSheet(wb, Txt(d.Cells(k, C_NAME).Value))
            If Not sh Is Nothing Then
                For r = Q_S0 To Q_S1
                    If SameText(Txt(sh.Cells(r, Q_ID).Value), id) Then
                        rowOut = r
                        Set FindStudent = sh
                        Exit Function
                    End If
                Next r
            End If
        End If
    Next k
End Function

Public Sub BtnExecTransfers()
    Dim wb As Workbook, wasOpen As Boolean, d As Range, ws As Worksheet, src As Worksheet, dst As Worksheet
    Dim r As Long, sr As Long, fr As Long, c As Long, tc As Long, k As Long, rs As Long, nOk As Long, nNew As Long
    Dim id As String, hint As String, tgt As String, lbl As String, tQ As String, sAct As String, msg As String
    Dim segMap(Q_C0 To Q_C1) As Long, newLbl(Q_C0 To Q_C1) As Boolean, ok As Boolean, usedCols As Object, touched As Object, kName As Variant
    On Error GoTo EH
    Set ws = ThisWorkbook.Worksheets(SH_TRANS)
    r = TR0
    Do While Len(Txt(ws.Cells(r, 2).Value)) > 0
        If Len(Txt(ws.Cells(r, 5).Value)) > 0 And Not SameText(Txt(ws.Cells(r, 5).Value), Txt(ws.Cells(r, 3).Value)) Then k = k + 1
        r = r + 1
    Loop
    If k = 0 Then
        MsgBox T("mNoTransfers"), vbExclamation
        Exit Sub
    End If
    If MsgBox(Replace(T("mConfirmTransfers"), "{n}", CStr(k)) & vbLf & vbLf & T("mContinue"), _
              vbYesNo + vbQuestion + vbDefaultButton2) <> vbYes Then Exit Sub
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set d = DB(wb)
    tQ = LV(wb, "LST_Type", 2)
    sAct = LV(wb, "LST_Status", 1)
    BackupBook wb
    Set touched = CreateObject("Scripting.Dictionary")
    r = TR0
    Do While Len(Txt(ws.Cells(r, 2).Value)) > 0
        id = Txt(ws.Cells(r, 2).Value)
        hint = Txt(ws.Cells(r, 3).Value)
        tgt = Txt(ws.Cells(r, 5).Value)
        msg = ""
        If Len(tgt) > 0 And Not SameText(tgt, hint) Then
            Status T("aTransfer") & ": " & id
            sr = 0
            Set src = FindStudent(wb, d, tQ, id, hint, sr)
            If src Is Nothing Then
                msg = T("trNotFound")
            ElseIf SameText(src.Name, tgt) Then
                msg = T("trSame")
            Else
                ' target class: register and create when missing
                k = FindRow(d, tgt)
                If k = 0 Then
                    If Not ValidSheetName(tgt) Then
                        msg = T("hcBadName")
                    Else
                        k = FirstEmptyRow(d)
                        rs = FindRow(d, src.Name)
                        If k = 0 Or rs = 0 Then
                            msg = T("rsNoRoom")
                        Else
                            For c = 2 To C_LASTIN
                                d.Cells(k, c).Value = d.Cells(rs, c).Value
                            Next c
                            d.Cells(k, C_NAME).Value = tgt
                            d.Cells(k, C_NEXT).ClearContents
                            d.Cells(k, C_TRANS).ClearContents
                            d.Cells(k, C_STATUS).Value = sAct
                            nNew = nNew + 1
                        End If
                    End If
                ElseIf Not SameText(Txt(d.Cells(k, C_TYPE).Value), tQ) Then
                    msg = T("trNotQuran")
                End If
                If Len(msg) = 0 Then
                    Set dst = EnsureSheet(wb, d, k, tQ)
                    If dst Is Nothing Then
                        msg = T("hcBadName")
                    Else
                        Application.Calculate
                        fr = FreeStudentRow(dst)
                        If fr = 0 Then msg = T("trFull")
                    End If
                End If
                If Len(msg) = 0 Then
                    ' map every graded segment of the source to a column of the target (same segment label)
                    ok = True
                    Set usedCols = CreateObject("Scripting.Dictionary")
                    For c = Q_C0 To Q_C1
                        segMap(c) = 0
                        newLbl(c) = False
                        If Len(Txt(src.Cells(sr, c).Value)) > 0 Then
                            lbl = Txt(src.Cells(Q_RLABEL, c).Value)
                            For tc = Q_C0 To Q_C1
                                If Len(lbl) > 0 And SameText(Txt(dst.Cells(Q_RLABEL, tc).Value), lbl) Then
                                    segMap(c) = tc
                                    Exit For
                                End If
                            Next tc
                            If segMap(c) = 0 Then
                                For tc = Q_C0 To Q_C1
                                    If Len(Txt(dst.Cells(Q_RLABEL, tc).Value)) = 0 And Not usedCols.Exists(tc) Then
                                        segMap(c) = tc
                                        newLbl(c) = True
                                        Exit For
                                    End If
                                Next tc
                            End If
                            If segMap(c) = 0 Then ok = False
                            If segMap(c) > 0 Then usedCols(segMap(c)) = True
                        End If
                    Next c
                    If Not ok Then
                        msg = T("trNoSeg")
                    Else
                        Unprot dst
                        dst.Cells(fr, Q_ID).NumberFormat = "@"
                        dst.Cells(fr, Q_ID).Value = id
                        dst.Cells(fr, Q_SNAME).Value = src.Cells(sr, Q_SNAME).Value
                        For c = Q_C0 To Q_C1
                            If segMap(c) > 0 Then
                                If newLbl(c) Then dst.Cells(Q_RLABEL, segMap(c)).Value = Txt(src.Cells(Q_RLABEL, c).Value)
                                dst.Cells(fr, segMap(c)).Value = src.Cells(sr, c).Value
                            End If
                        Next c
                        Prot dst
                        Unprot src
                        src.Range(src.Cells(sr, Q_ID), src.Cells(sr, Q_SNAME)).ClearContents
                        src.Range(src.Cells(sr, Q_C0), src.Cells(sr, Q_C1)).ClearContents
                        Prot src
                        touched(src.Name) = True
                        msg = T("trDone") & " " & src.Name & "  " & ChrW(&H2190) & "  " & dst.Name
                        ws.Cells(r, 3).Value = dst.Name
                        ws.Cells(r, 5).ClearContents
                        nOk = nOk + 1
                    End If
                End If
            End If
            ws.Cells(r, 6).Value = msg
            ws.Cells(r, 6).HorizontalAlignment = xlRight
            ws.Cells(r, 6).Font.Color = IIf(InStr(msg, T("trDone")) = 1, cPri(), cTerra())
        End If
        r = r + 1
    Loop
    For Each kName In touched.Keys
        CompactStudents wb.Worksheets(CStr(kName))
    Next kName
    wb.Worksheets(1).Activate
    Application.Calculate
    CloseBook wb, wasOpen, (nOk > 0 Or nNew > 0)
    EndWork
    WriteLog T("aTransfer"), nOk & " / " & nNew
    MsgBox Replace(Replace(T("mTransfersDone"), "{n}", CStr(nOk)), "{c}", CStr(nNew)), vbInformation
    Exit Sub
EH:
    ShowError
End Sub

' removes empty rows between students (values only; formulas untouched)
Private Sub CompactStudents(sh As Worksheet)
    Dim a As Variant, g As Variant, newA() As Variant, newG() As Variant, i As Long, j As Long, k As Long
    Dim nR As Long, nCols As Long
    a = sh.Range(sh.Cells(Q_S0, Q_ID), sh.Cells(Q_S1, Q_SNAME)).Value
    g = sh.Range(sh.Cells(Q_S0, Q_C0), sh.Cells(Q_S1, Q_C1)).Value
    nR = Q_S1 - Q_S0 + 1
    nCols = Q_C1 - Q_C0 + 1
    ReDim newA(1 To nR, 1 To 2)
    ReDim newG(1 To nR, 1 To nCols)
    For i = 1 To nR
        If Len(Txt(a(i, 1))) > 0 Or Len(Txt(a(i, 2))) > 0 Then
            k = k + 1
            newA(k, 1) = a(i, 1)
            newA(k, 2) = a(i, 2)
            For j = 1 To nCols
                newG(k, j) = g(i, j)
            Next j
        End If
    Next i
    Unprot sh
    sh.Range(sh.Cells(Q_S0, Q_ID), sh.Cells(Q_S1, Q_SNAME)).Value = newA
    sh.Range(sh.Cells(Q_S0, Q_C0), sh.Cells(Q_S1, Q_C1)).Value = newG
    Prot sh
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
        If SameText(Txt(rg.Cells(i, 1).Value), dayName) Then
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
    Dim lst As Collection, wb As Workbook, wasOpen As Boolean, d As Range
    Dim untilToday As Boolean, fillExec As Boolean, sAct As String, tQ As String
    Dim r As Long, nm As Variant, sh As Worksheet, nd As Long, ne As Long, why As String
    Dim totD As Long, totE As Long, uTxt As String
    On Error GoTo EH
    untilToday = Not SameText(Txt(CfgCell("CFG_FillUntil").Value), ListVal(1, 2))
    fillExec = Not SameText(Txt(CfgCell("CFG_FillExec").Value), ListVal(2, 2))
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
    Set d = DB(wb)
    sAct = LV(wb, "LST_Status", 1)
    tQ = LV(wb, "LST_Type", 2)
    If lst.Count = 0 Then
        For r = 2 To d.Rows.Count
            If Len(Txt(d.Cells(r, C_NAME).Value)) > 0 And IsActiveStatus(Txt(d.Cells(r, C_STATUS).Value), sAct) Then
                lst.Add Txt(d.Cells(r, C_NAME).Value)
            End If
        Next r
    End If
    Application.ScreenUpdating = True
    If MsgBox(Replace(Replace(T("mFillConfirm"), "{n}", CStr(lst.Count)), "{u}", uTxt), vbYesNo + vbQuestion) <> vbYes Then
        CloseBook wb, wasOpen, False
        EndWork
        Exit Sub
    End If
    Application.ScreenUpdating = False
    LoadHolidays wb
    BackupBook wb
    RepStart T("aFill") & " (" & uTxt & ")"
    For Each nm In lst
        r = FindRow(d, CStr(nm))
        Set sh = FindSheet(wb, CStr(nm))
        nd = 0: ne = 0: why = ""
        If r = 0 Then
            Rep 2, CStr(nm), T("whyNoRow")
        ElseIf sh Is Nothing Then
            Rep 2, CStr(nm), T("whyNoSheet")
        Else
            Status T("aFill") & ": " & nm
            nd = FillOne(wb, sh, d, r, SameText(Txt(d.Cells(r, C_TYPE).Value), tQ), untilToday, fillExec, ne, why)
            If Len(why) > 0 Then
                Rep 2, CStr(nm), why
            Else
                Rep 3, CStr(nm), Replace(Replace(T("fillLine"), "{d}", CStr(nd)), "{e}", CStr(ne))
            End If
            totD = totD + nd
            totE = totE + ne
        End If
    Next nm
    Application.Calculate
    CloseBook wb, wasOpen, True
    EndWork
    WriteLog T("aFill"), uTxt & " | " & totD & " / " & totE
    ThisWorkbook.Worksheets(SH_REPORT).Activate
    MsgBox Replace(Replace(T("mFilled"), "{d}", CStr(totD)), "{e}", CStr(totE)), vbInformation
    Exit Sub
EH:
    ShowError
End Sub

Private Function FillOne(wb As Workbook, sh As Worksheet, d As Range, ByVal r As Long, ByVal isQ As Boolean, _
                         ByVal untilToday As Boolean, ByVal fillExec As Boolean, _
                         ByRef nExec As Long, ByRef why As String) As Long
    Dim dc(1 To 80) As Range, ec(1 To 80) As Range
    Dim n As Long, i As Long, j As Long, k As Long, c As Long, w As Long
    Dim d1 As Date, anyDay As Boolean, prev As Double, nxt As Double, dd As Double
    Dim filled As Long, teacher As String

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

    If Not HasDateVal(d.Cells(r, C_START).Value) Then
        why = T("whyNoStart")
        Exit Function
    End If
    mD0 = CDate(d.Cells(r, C_START).Value)
    If HasDateVal(d.Cells(r, C_END).Value) Then
        d1 = CDate(d.Cells(r, C_END).Value)
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

    For w = 1 To 7
        mDays(w) = False
    Next w
    anyDay = False
    For k = C_DAY1 To C_DAY3
        w = DayNum(wb, Txt(d.Cells(r, k).Value))
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
            dc(i).Font.Color = RGB(31, 111, 168)
            dc(i).Font.Italic = True
            prev = dd
            filled = filled + 1
        End If
    Next i

    If fillExec Then
        teacher = Txt(d.Cells(r, C_TEACHER).Value)
        If Len(teacher) > 0 Then
            For i = 1 To n
                If HasDateVal(dc(i).Value) And Len(Txt(ec(i).Value)) = 0 Then
                    ec(i).Value = teacher
                    ec(i).Font.Color = RGB(31, 111, 168)
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
    Dim wb As Workbook, wasOpen As Boolean, d As Range, sh As Worksheet, n As Object
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
    Set d = DB(wb)
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
    For r = 2 To d.Rows.Count
        nm = Txt(d.Cells(r, C_NAME).Value)
        If Len(nm) > 0 Then
            Status T("bHealth") & ": " & nm
            st = Txt(d.Cells(r, C_STATUS).Value)
            ty = Txt(d.Cells(r, C_TYPE).Value)
            If seen.Exists(nm) Then
                Rep 1, nm, T("hcDup")
            Else
                seen(nm) = True
            End If
            If Not ValidSheetName(nm) Then Rep 1, nm, T("hcBadName")
            Set sh = FindSheet(wb, nm)
            If IsActiveStatus(st, sAct) And sh Is Nothing Then Rep 1, nm, T("hcNoSheet")
            If SameText(st, sArc) Or SameText(st, sDel) Then Rep 3, nm, T("hcPending")
            If Len(Txt(d.Cells(r, C_TEACHER).Value)) = 0 Then Rep 2, nm, T("hcNoTeacher")
            hasPeriod = HasDateVal(d.Cells(r, C_START).Value) And HasDateVal(d.Cells(r, C_END).Value)
            If hasPeriod Then
                d0 = CDate(d.Cells(r, C_START).Value)
                d1 = CDate(d.Cells(r, C_END).Value)
            ElseIf IsActiveStatus(st, sAct) Then
                Rep 2, nm, T("hcNoPeriod")
            End If
            anyDay = False
            For k = C_DAY1 To C_DAY3
                If Len(Txt(d.Cells(r, k).Value)) > 0 Then anyDay = True
            Next k
            If Not anyDay And IsActiveStatus(st, sAct) Then Rep 3, nm, T("hcNoDays")
            nx = Txt(d.Cells(r, C_NEXT).Value)
            If Len(nx) > 0 And IsActiveStatus(st, sAct) Then
                If Not HasDateVal(d.Cells(r, C_TRANS).Value) Then Rep 2, nm, T("hcNoTrans")
                If FindRow(d, nx) = 0 Then Rep 3, nm, T("hcNextNoRow") & " " & nx
            End If
            If Not sh Is Nothing Then
                If SameText(ty, tQ) Then
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
    If mRepRow = 5 Then Rep 3, "", T("hcOk")
    CloseBook wb, wasOpen, False
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
    Dim dd As Date
    If Len(Txt(v)) = 0 Then Exit Sub
    If Not HasDateVal(v) Then
        Rep 1, nm, T("hcBadDate") & " - " & where
        Exit Sub
    End If
    dd = CDate(v)
    If Weekday(dd, vbSunday) > 5 Then Rep 2, nm, T("hcWeekend") & " - " & where & " - " & Format(dd, "yyyy/mm/dd")
    If hasPeriod Then
        If dd < d0 Or dd > d1 Then Rep 2, nm, T("hcOut") & " - " & where & " - " & Format(dd, "yyyy/mm/dd")
    End If
    If IsHoliday(dd) Then Rep 2, nm, T("hcHoliday") & " - " & where & " - " & Format(dd, "yyyy/mm/dd")
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
                    If Not SameText(Txt(v), absTxt) Then bad = True
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
    Dim lst As Collection, wb As Workbook, wasOpen As Boolean, d As Range, tQ As String
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
    Set d = DB(wb)
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
        k = FindRow(d, CStr(nm))
        If k > 0 Then
            If SameText(Txt(d.Cells(k, C_TYPE).Value), tQ) Then
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
    CloseBook wb, wasOpen, False
    If used = 0 Then
        outWb.Close SaveChanges:=False
        EndWork
        MsgBox T("mNoQuranSel") & IIf(Len(miss) > 0, vbLf & T("mMissingSheets") & miss, ""), vbExclamation
        Exit Sub
    End If
    With ws.Range("A1:D1")
        .Font.Bold = True
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = cInk()
        .HorizontalAlignment = xlCenter
    End With
    ws.Range("A1:D" & (i - 1)).Borders.Color = cLine()
    ws.Range("C2:C" & (i - 1)).HorizontalAlignment = xlCenter
    ws.Columns("A:D").AutoFit
    fld = TargetFolder() & "\Exports"
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
' BUTTON: follow-up report (snapshot of the dashboard as values)
'=========================================================================
Public Sub BtnFollowUp()
    Dim wb As Workbook, wasOpen As Boolean, dash As Worksheet, outWb As Workbook, ws As Worksheet, fld As String, fn As String
    On Error GoTo EH
    BeginWork
    Set wb = OpenTarget(False, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Application.Calculate
    UnlockBook wb
    Set dash = wb.Names("SYS_Dash").RefersToRange.Worksheet
    dash.Copy
    Set outWb = ActiveWorkbook
    Set ws = outWb.Worksheets(1)
    ValueizeSheet ws
    On Error Resume Next
    ws.AutoFilterMode = False
    ws.Name = "FollowUp"
    On Error GoTo EH
    ws.Range("A4").Value = T("fuNote") & " " & Format(Now, "yyyy/mm/dd hh:nn")
    BreakExternal outWb
    CloseBook wb, wasOpen, False
    fld = TargetFolder() & "\Exports"
    If Not FSO.FolderExists(fld) Then FSO.CreateFolder fld
    fn = fld & "\FollowUp_" & Format(Now, "yyyymmdd_hhnnss") & ".xlsx"
    outWb.SaveAs Filename:=fn, FileFormat:=51
    EndWork
    WriteLog T("bFollow"), fn
    outWb.Activate
    MsgBox T("mFollowDone") & vbLf & fn, vbInformation
    Exit Sub
EH:
    ShowError
End Sub

'=========================================================================
' BUTTON: import an old-format (version 1) plan file
'=========================================================================
Private Function FindSheetByCell(wb As Workbook, ByVal addr As String, ByVal txtVal As String) As Worksheet
    Dim ws As Worksheet
    For Each ws In wb.Worksheets
        If SameText(Txt(ws.Range(addr).Value), txtVal) Then
            Set FindSheetByCell = ws
            Exit Function
        End If
    Next ws
End Function

Public Sub BtnImportOld()
    Dim p As String, oldWb As Workbook, oldWasOpen As Boolean, wb As Workbook, wasOpen As Boolean, d As Range
    Dim oD As Worksheet, oT As Worksheet, oS As Worksheet, nS As Worksheet, tw As Worksheet
    Dim r As Long, rr As Long, k As Long, nr As Long, nm As String, ex As String, v As Variant
    Dim nRows As Long, nSheets As Long, nDates As Long, nTeach As Long, last As Long, tL As String, sAct As String, tQ As String
    On Error GoTo EH
    p = PickFile(T("dlgPickOld"))
    If Len(p) = 0 Then Exit Sub
    If SameText(p, TargetPath()) Then
        MsgBox T("mSameFile"), vbExclamation
        Exit Sub
    End If
    If MsgBox(T("mConfirmImport"), vbYesNo + vbQuestion + vbDefaultButton2) <> vbYes Then Exit Sub
    BeginWork
    Set wb = OpenTarget(True, wasOpen)
    If wb Is Nothing Then
        EndWork
        Exit Sub
    End If
    Set oldWb = OpenBook(p, False, oldWasOpen)
    Set oD = FindSheetByCell(oldWb, "A1", T("oldDataA1"))
    If oD Is Nothing Then
        If Not oldWasOpen Then oldWb.Close SaveChanges:=False
        CloseBook wb, wasOpen, False
        EndWork
        MsgBox T("mOldNotFound"), vbExclamation
        Exit Sub
    End If
    Set d = DB(wb)
    tL = LV(wb, "LST_Type", 1)
    tQ = LV(wb, "LST_Type", 2)
    sAct = LV(wb, "LST_Status", 1)
    BackupBook wb
    RepStart T("bImport")

    ' teachers
    Set oT = FindSheetByCell(oldWb, "A1", T("oldTeachA1"))
    Set tw = wb.Names("SYS_Teachers").RefersToRange.Worksheet
    If Not oT Is Nothing Then
        last = oT.Cells(oT.Rows.Count, 1).End(xlUp).Row
        For r = 2 To last
            nm = Txt(oT.Cells(r, 1).Value)
            If Len(nm) > 0 And Not SameText(nm, T("oldPh")) Then
                If Application.WorksheetFunction.CountIf(tw.Range("A2:A300"), nm) = 0 Then
                    k = tw.Cells(tw.Rows.Count, 1).End(xlUp).Row + 1
                    If k < 2 Then k = 2
                    tw.Cells(k, 1).Value = nm
                    nTeach = nTeach + 1
                End If
            End If
        Next r
    End If

    ' classes and their lesson dates
    last = oD.Cells(oD.Rows.Count, 1).End(xlUp).Row
    For r = 3 To last
        nm = Txt(oD.Cells(r, 1).Value)
        If Len(nm) > 0 And Not SameText(nm, T("oldChoose")) And nm <> "-" Then
            Status T("bImport") & ": " & nm
            rr = FindRow(d, nm)
            If rr = 0 Then
                rr = FirstEmptyRow(d)
                If rr = 0 Then
                    Rep 1, nm, T("rsNoRoom")
                Else
                    d.Cells(rr, C_NAME).Value = nm
                    d.Cells(rr, C_TYPE).Value = tL
                    d.Cells(rr, C_TEACHER).Value = oD.Cells(r, 2).Value
                    d.Cells(rr, C_COURSE).Value = oD.Cells(r, 3).Value
                    d.Cells(rr, C_PART).Value = oD.Cells(r, 4).Value
                    If HasDateVal(oD.Cells(r, 5).Value) Then d.Cells(rr, C_EXAMA).Value = oD.Cells(r, 5).Value
                    If HasDateVal(oD.Cells(r, 6).Value) Then d.Cells(rr, C_EXAMF).Value = oD.Cells(r, 6).Value
                    d.Cells(rr, C_STUD).Value = oD.Cells(r, 7).Value
                    d.Cells(rr, C_STATUS).Value = sAct
                    nRows = nRows + 1
                End If
            End If
            Set oS = FindSheet(oldWb, nm)
            If rr > 0 And Not oS Is Nothing Then
                If SameText(Txt(oS.Range("C4").Value), T("oldWeek")) Then
                    Set nS = EnsureSheet(wb, d, rr, tQ)
                    If Not nS Is Nothing Then
                        nSheets = nSheets + 1
                        k = 0
                        Unprot nS
                        For nr = 5 To 51
                            If nr <> 32 And nr <> 51 Then
                                v = oS.Cells(nr, 7).Value
                                If HasDateVal(v) And Len(Txt(nS.Cells(nr + 3, L_DATE).Value)) = 0 Then
                                    nS.Cells(nr + 3, L_DATE).Value = CDate(v)
                                    k = k + 1
                                End If
                                ex = Txt(oS.Cells(nr, 8).Value)
                                If Len(ex) > 0 And Not SameText(ex, T("oldPh")) And Len(Txt(nS.Cells(nr + 3, L_EXEC).Value)) = 0 Then
                                    nS.Cells(nr + 3, L_EXEC).Value = ex
                                End If
                            End If
                        Next nr
                        Prot nS
                        nDates = nDates + k
                        Rep 3, nm, Replace(T("impLine"), "{d}", CStr(k))
                    End If
                Else
                    Rep 2, nm, T("impNotClass")
                End If
            ElseIf rr > 0 Then
                Rep 3, nm, T("impNoSheet")
            End If
        End If
    Next r
    If Not oldWasOpen Then oldWb.Close SaveChanges:=False
    wb.Worksheets(1).Activate
    Application.Calculate
    CloseBook wb, wasOpen, True
    EndWork
    WriteLog T("bImport"), p & " | " & nRows & " / " & nSheets & " / " & nDates
    ThisWorkbook.Worksheets(SH_REPORT).Activate
    MsgBox Replace(Replace(Replace(Replace(T("mImported"), "{r}", CStr(nRows)), "{s}", CStr(nSheets)), "{d}", CStr(nDates)), "{t}", CStr(nTeach)), vbInformation
    BtnRefresh
    Exit Sub
EH:
    ShowError
End Sub
