Attribute VB_Name = "AdminTool"
'==========================================================================
' √œ«… „”ƒÊ· «·Œÿ…  -   ı” ⁄„· „‰ „·› Œ«’ »ﬂ ›ﬁÿ (xlsm)° Ê·Ì” „‰ „·› «·„œ—”Ì‰
' «·›ﬂ—…:  › Õ „·› «·„œ—”Ì‰° Ê ‰‘∆ √Ê—«ﬁ «·›’Ê· «·‰«ﬁ’… „‰ Ê—ﬁ… "‰„Ê–Ã"°
' Ê Õ–› √Ê—«ﬁ «·›’Ê· «·„ƒ—‘›…. ·«  ÷⁄ Â–« «·ﬂÊœ œ«Œ· „·› «·„œ—”Ì‰.
'
' «· —ﬂÌ»: „·› Excel ÃœÌœ -> «Õ›ŸÂ xlsm -> Alt+F11 -> File > Import File
'          -> «Œ — Â–« «·„·› -> À„ «œŒ· Developer > Macros Ê‘€¯·: CreateMissingSheets
' («Œ Ì«—Ì) √÷› “—« ⁄·Ï Ê—ﬁ… «·„·› Ê«‰”» ≈·ÌÂ «·„«ﬂ—Ê.
'==========================================================================
Option Explicit

Private Const DATA_SHEET As String = "»Ì«‰« _«·›’Ê·"
Private Const TEMPLATE_SHEET As String = "‰„Ê–Ã"
Private Const FIRST_ROW As Long = 2
Private Const LAST_ROW As Long = 251

Private Function PickFile() As String
    Dim fd As FileDialog
    Set fd = Application.FileDialog(msoFileDialogFilePicker)
    fd.Title = "«Œ — „·› Œÿ… «· œ—Ì” („·› «·„œ—”Ì‰)"
    fd.Filters.Clear
    fd.Filters.Add "Excel", "*.xlsx;*.xlsm;*.xls"
    fd.AllowMultiSelect = False
    If fd.Show = -1 Then PickFile = fd.SelectedItems(1)
End Function

Private Function OpenTarget(ByRef path As String) As Workbook
    Dim wb As Workbook
    path = PickFile()
    If path = "" Then Exit Function
    Set wb = Workbooks.Open(path, UpdateLinks:=0)
    If wb.MultiUserEditing Then
        On Error Resume Next
        wb.ExclusiveAccess   ' ÌÊﬁ› «·„‘«—ﬂ… (ﬂ„«  ›⁄· ÌœÊÌ«)
        On Error GoTo 0
        If wb.MultiUserEditing Then
            MsgBox "«·„·› „« “«· „‘«—ﬂ«. √Êﬁ› «·„‘«—ﬂ… √Ê·« („—«Ã⁄… > „‘«—ﬂ… «·„’‰›) Ê √ﬂœ √‰ «·„œ—”Ì‰ Œ«—Ã «·„·›.", vbExclamation
            wb.Close SaveChanges:=False
            Exit Function
        End If
    End If
    Set OpenTarget = wb
End Function

Private Function SheetExists(wb As Workbook, ByVal nm As String) As Boolean
    Dim ws As Object
    For Each ws In wb.Sheets
        If StrComp(ws.Name, nm, vbTextCompare) = 0 Then SheetExists = True: Exit Function
    Next ws
End Function

Private Function ValidName(ByVal nm As String) As Boolean
    Dim ch As Variant
    ValidName = (Len(nm) > 0 And Len(nm) <= 31)
    For Each ch In Array("[", "]", "/", "\", "?", "*", ":")
        If InStr(nm, ch) > 0 Then ValidName = False
    Next ch
End Function

Private Sub Backup(wb As Workbook)
    Dim p As String
    p = wb.Path & "\" & "backup_" & Format(Now, "yyyymmdd_hhnn") & "_" & wb.Name
    wb.SaveCopyAs p
End Sub

'--------------------------------------------------------------------------
' 1) ≈‰‘«¡ √Ê—«ﬁ «·›’Ê· «·‰«ﬁ’… (··›’Ê· «·Õ«· Â« ·Ì”  "„ƒ—‘›")
'--------------------------------------------------------------------------
Public Sub CreateMissingSheets()
    Dim path As String, wb As Workbook, wsD As Worksheet, tpl As Worksheet
    Dim r As Long, nm As String, st As String
    Dim made As String, bad As String, n As Long
    Application.ScreenUpdating = False
    Set wb = OpenTarget(path)
    If wb Is Nothing Then Exit Sub
    On Error GoTo Fail
    Set wsD = wb.Worksheets(DATA_SHEET)
    Set tpl = wb.Worksheets(TEMPLATE_SHEET)
    Backup wb
    For r = FIRST_ROW To LAST_ROW
        nm = Trim$(CStr(wsD.Cells(r, 1).Value))
        st = Trim$(CStr(wsD.Cells(r, 8).Value))
        If nm <> "" And st <> "„ƒ—‘›" Then
            If Not SheetExists(wb, nm) Then
                If ValidName(nm) Then
                    tpl.Copy After:=wb.Sheets(wb.Sheets.Count)
                    wb.Sheets(wb.Sheets.Count).Name = nm
                    made = made & vbCrLf & " + " & nm
                    n = n + 1
                Else
                    bad = bad & vbCrLf & " ! " & nm
                End If
            End If
        End If
    Next r
    wb.Worksheets(1).Activate
    wb.Save
    wb.Close SaveChanges:=False
    Application.ScreenUpdating = True
    MsgBox " „ ≈‰‘«¡ " & n & " Ê—ﬁ…." & made & IIf(bad <> "", vbCrLf & vbCrLf & "√”„«¡ €Ì— ’«·Õ… (·„  ı‰‘√):" & bad, ""), vbInformation
    Exit Sub
Fail:
    Application.ScreenUpdating = True
    MsgBox "ÕœÀ Œÿ√: " & Err.Description & vbCrLf & "·„ ÌıÕ›Ÿ «·„·›.  ÊÃœ ‰”Œ… «Õ Ì«ÿÌ… »ÃÊ«—Â.", vbCritical
    On Error Resume Next
    wb.Close SaveChanges:=False
End Sub

'--------------------------------------------------------------------------
' 2) Õ–› √Ê—«ﬁ «·›’Ê· «·„ƒ—‘›… (»⁄œ ⁄—÷ «·ﬁ«∆„… Êÿ·» «· √ﬂÌœ)
'--------------------------------------------------------------------------
Public Sub DeleteArchivedSheets()
    Dim path As String, wb As Workbook, wsD As Worksheet
    Dim r As Long, nm As String, st As String
    Dim lst As String, n As Long, names() As String
    Application.ScreenUpdating = False
    Set wb = OpenTarget(path)
    If wb Is Nothing Then Exit Sub
    On Error GoTo Fail
    Set wsD = wb.Worksheets(DATA_SHEET)
    ReDim names(0 To 300)
    For r = FIRST_ROW To LAST_ROW
        nm = Trim$(CStr(wsD.Cells(r, 1).Value))
        st = Trim$(CStr(wsD.Cells(r, 8).Value))
        If nm <> "" And st = "„ƒ—‘›" Then
            If SheetExists(wb, nm) And nm <> TEMPLATE_SHEET And nm <> DATA_SHEET Then
                names(n) = nm: n = n + 1: lst = lst & vbCrLf & " - " & nm
            End If
        End If
    Next r
    Application.ScreenUpdating = True
    If n = 0 Then
        MsgBox "·«  ÊÃœ √Ê—«ﬁ „ƒ—‘›… ··Õ–›.", vbInformation
        wb.Close SaveChanges:=False: Exit Sub
    End If
    If MsgBox("” ıÕ–› " & n & " Ê—ﬁ… ‰Â«∆Ì« („⁄ ‰”Œ… «Õ Ì«ÿÌ… »ÃÊ«— «·„·›):" & lst & vbCrLf & vbCrLf & "„ «»⁄…ø", vbYesNo + vbExclamation + vbDefaultButton2) <> vbYes Then
        wb.Close SaveChanges:=False: Exit Sub
    End If
    Backup wb
    Application.DisplayAlerts = False
    For r = 0 To n - 1
        wb.Sheets(names(r)).Delete
    Next r
    Application.DisplayAlerts = True
    wb.Worksheets(1).Activate
    wb.Save
    wb.Close SaveChanges:=False
    MsgBox " „ Õ–› " & n & " Ê—ﬁ….", vbInformation
    Exit Sub
Fail:
    Application.DisplayAlerts = True: Application.ScreenUpdating = True
    MsgBox "ÕœÀ Œÿ√: " & Err.Description, vbCritical
    On Error Resume Next
    wb.Close SaveChanges:=False
End Sub

'--------------------------------------------------------------------------
' 3)  ‘€Ì· «·«À‰Ì‰ „⁄«: ≈‰‘«¡ «·‰«ﬁ’ À„ ⁄—÷ «·„ƒ—‘› ··Õ–›
'--------------------------------------------------------------------------
Public Sub SyncSheets()
    CreateMissingSheets
    DeleteArchivedSheets
End Sub
