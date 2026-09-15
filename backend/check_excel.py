import openpyxl

wb = openpyxl.load_workbook('report/report_template.xlsx')
ws = wb.active

print('=== 標的產品區域 (Row 1-30, Col A-O) ===')
for row in ws.iter_rows(min_row=1, max_row=30, min_col=1, max_col=15, values_only=False):
    for cell in row:
        if cell.value is not None:
            print(f'{cell.coordinate}: {cell.value}')