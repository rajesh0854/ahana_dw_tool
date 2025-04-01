from src.oracle_func.mapping_funtion import create_update_mapping,create_update_mapping_detail, validate_logic2 ,validate_all_mapping_details
from src.query_func.job import get_job_list, call_create_update_job
from src.query_func.maping import get_parameter_mapping, add_parameter_mapping,get_mapping_ref, get_mapping_details ,get_error_messages_list,get_parameter_mapping_datatype,get_parameter_mapping_scd_type,call_activate_deactivate_mapping
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import uuid
import os
import datetime
import json
import io
import oracledb
from sqlalchemy import create_engine, text
import random
import re
import traceback
from login import auth_bp, token_required
from admin import admin_bp, admin_required
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from license_manager import LicenseManager
from openpyxl import Workbook, load_workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
 

# Initialize license manager at module level
license_manager = LicenseManager()

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "expose_headers": ["Authorization"]
    }
})

# Load environment variables
load_dotenv()

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(admin_bp, url_prefix='/admin')

# Oracle database configuration
db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_sid = os.getenv('DB_SID')

dsn = oracledb.makedsn(db_host, db_port, sid=db_sid)
connection_string = f"oracle+oracledb://{db_user}:{db_password}@{dsn}"

# SQLite configuration for user management
sqlite_engine = create_engine(os.getenv('SQLITE_DATABASE_URL'))

def create_oracle_connection():
    try:
        connection = oracledb.connect(
            user=db_user,
            password=db_password,
            dsn=f"{db_host}:{db_port}/{db_sid}"
        )
        print("Oracle connection established successfully")
        return connection
    except Exception as e:
        print(f"Error establishing Oracle connection: {str(e)}")
        raise

# Create directories if they don't exist
os.makedirs('data/drafts', exist_ok=True)
os.makedirs('data/templates', exist_ok=True)

FORM_FIELDS = ["reference","description","sourceSystem","tableName","tableType","targetSchema","freqCode","bulkProcessRows"]
TABLE_FIELDS = ["primaryKey","pkSeq","fieldName","dataType","fieldDesc","scdType","keyColumn","valColumn","logic","mapCombineCode","execSequence"]

from openpyxl import Workbook, load_workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
 
FORM_FIELDS = ["reference","description","sourceSystem","tableName","tableType","targetSchema","freqCode","bulkProcessRows"]
 
TABLE_FIELDS = ["primaryKey","pkSeq","fieldName","dataType","fieldDesc","scdType","keyColumn","valColumn","logic","mapCombineCode","execSequence"]
 
 
@app.route('/mapper/download-template', methods=['GET'])
def download_template():
    try:
        # Create a new workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Mapping Template"
 
        # Define styles
        header_fill = PatternFill(start_color="00B050", end_color="00B050", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        header_alignment = Alignment(horizontal="center", vertical="center")
        border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
 
        # Write Form Fields section
        ws['A1'] = "Form Fields"
        ws.merge_cells('A1:H1')
        ws['A1'].fill = header_fill
        ws['A1'].font = header_font
        ws['A1'].alignment = header_alignment
 
        # Write Form Fields headers
        for col, field in enumerate(FORM_FIELDS, 1):
            cell = ws.cell(row=2, column=col)
            cell.value = field
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_alignment
            cell.border = border
 
        # Add empty row for form data
        for col in range(1, len(FORM_FIELDS) + 1):
            cell = ws.cell(row=3, column=col)
            cell.border = border
 
        # Add space between sections
        ws.append([])
 
        # Write Table Fields section
        current_row = 5
        ws.cell(row=current_row, column=1, value="Table Fields")
        ws.merge_cells(f'A{current_row}:K{current_row}')
        ws.cell(row=current_row, column=1).fill = header_fill
        ws.cell(row=current_row, column=1).font = header_font
        ws.cell(row=current_row, column=1).alignment = header_alignment
 
        # Write Table Fields headers
        current_row += 1
        for col, field in enumerate(TABLE_FIELDS, 1):
            cell = ws.cell(row=current_row, column=col)
            cell.value = field
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_alignment
            cell.border = border
 
        # Add empty rows for table data
        for row in range(current_row + 1, current_row + 11):  # 10 empty rows
            for col in range(1, len(TABLE_FIELDS) + 1):
                cell = ws.cell(row=row, column=col)
                cell.border = border
 
        # Adjust column widths (FIXED LOGIC)
        for col_idx in range(1, max(len(FORM_FIELDS), len(TABLE_FIELDS)) + 1):
            max_length = 0
            column_letter = get_column_letter(col_idx)  # Use get_column_letter directly instead of cell attribute
 
            # Check form headers (row 2)
            if col_idx <= len(FORM_FIELDS):
                header_value = ws.cell(row=2, column=col_idx).value
                if header_value:
                    max_length = max(max_length, len(str(header_value)))
 
            # Check table headers (row 6)
            if col_idx <= len(TABLE_FIELDS):
                header_value = ws.cell(row=current_row, column=col_idx).value
                if header_value:
                    max_length = max(max_length, len(str(header_value)))
 
            # Set the column width
            adjusted_width = (max_length + 2)
            ws.column_dimensions[column_letter].width = adjusted_width
 
        # Save to BytesIO buffer
        excel_buffer = io.BytesIO()
        wb.save(excel_buffer)
        excel_buffer.seek(0)
 
        return send_file(
            excel_buffer,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='mapper_template.xlsx'
        )
    except Exception as e:
        print(f"Error in download_template: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
   
 
@app.route('/mapper/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
 
        file = request.files['file']
        print(file)
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
 
        # if not file.filename.endswith('.xlsx'):
        #     return jsonify({'error': 'Only Excel (.xlsx) files are allowed'}), 400
 
        # Read the Excel file
        wb = load_workbook(io.BytesIO(file.read()))
        ws = wb.active
 
        # Process form fields
        form_data = {}
        form_headers = [cell.value for cell in ws[2] if cell.value]  # Get headers from row 2
        form_values = [cell.value for cell in ws[3] if cell.column <= len(form_headers)]  # Get values from row 3
 
        for header, value in zip(form_headers, form_values):
            form_data[header] = str(value) if value is not None else ''
 
        # Process table fields
        table_start_row = 6  # Table headers start at row 6
        table_headers = [cell.value for cell in ws[table_start_row] if cell.value]
        rows = []
 
        for row in ws.iter_rows(min_row=table_start_row + 1, max_col=len(table_headers)):
            row_data = {}
            has_data = False
           
            for header, cell in zip(table_headers, row):
                value = cell.value
               
                # Handle boolean fields
                if header == 'primaryKey':
                    if isinstance(value, bool):
                        value = value
                    elif isinstance(value, (int, float)):
                        value = bool(value)
                    else:
                        value = str(value).lower().strip() in ['true', '1', 'yes', 'y'] if value else False
                elif value is None:
                    value = ''
                else:
                    value = str(value).strip()
                    if value:
                        has_data = True
               
                row_data[header] = value
 
            if has_data:
                rows.append(row_data)
 
        # Map the data to the required format
        mapped_rows = []
        for row in rows:
            mapped_row = {
                'mapdtlid': '',  # This will be empty for new rows
                'fieldName': row.get('fieldName', ''),
                'dataType': row.get('dataType', ''),
                'primaryKey': row.get('primaryKey', False),
                'pkSeq': row.get('pkSeq', ''),
                'nulls': False,  # Default value, modify if your Excel has this field
                'logic': row.get('logic', ''),
                'validator': 'N',  # Default value
                'keyColumn': row.get('keyColumn', ''),
                'valColumn': row.get('valColumn', ''),
                'mapCombineCode': row.get('mapCombineCode', ''),
                'LogicVerFlag': 'N',  # Default value
                'scdType': row.get('scdType', ''),
                'fieldDesc': row.get('fieldDesc', ''),
                'execSequence': row.get('execSequence', '')
            }
            mapped_rows.append(mapped_row)
 
        # Prepare response data
        response_data = {
            'formData': {
                'reference': str(form_data.get('reference', '')).strip(),
                'description': str(form_data.get('description', '')).strip(),
                'mapperId': '',  # This might need to be generated or extracted
                'targetSchema': str(form_data.get('targetSchema', '')).strip(),
                'tableName': str(form_data.get('tableName', '')).strip(),
                'tableType': str(form_data.get('tableType', '')).strip(),
                'freqCode': str(form_data.get('freqCode', '')).strip(),
                'sourceSystem': str(form_data.get('sourceSystem', '')).strip(),
                'bulkProcessRows': form_data.get('bulkProcessRows', '')
            },
            'rows': mapped_rows
        }
        # print(response_data)
 
        return jsonify(response_data)
    except Exception as e:
        print(f"Error in upload_file: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
   
 
@app.route('/mapper/download-current', methods=['POST'])
def download_current():
    try:
        data = request.json
        form_data = data.get('formData', {})
        rows = data.get('rows', [])
 
        # Create a new workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Current Mapping"
 
        # Define styles
        header_fill = PatternFill(start_color="00B050", end_color="00B050", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        header_alignment = Alignment(horizontal="center", vertical="center")
        border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
 
        # Write Form Fields section
        ws['A1'] = "Form Fields"
        ws.merge_cells('A1:H1')
        ws['A1'].fill = header_fill
        ws['A1'].font = header_font
        ws['A1'].alignment = header_alignment
 
        # Write Form Fields headers
        for col, field in enumerate(FORM_FIELDS, 1):
            cell = ws.cell(row=2, column=col)
            cell.value = field
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_alignment
            cell.border = border
 
        # Write form data
        for col, field in enumerate(FORM_FIELDS, 1):
            cell = ws.cell(row=3, column=col)
            cell.value = form_data.get(field, '')
            cell.border = border
 
        # Add space between sections
        ws.append([])
 
        # Write Table Fields section
        current_row = 5
        ws.cell(row=current_row, column=1, value="Table Fields")
        ws.merge_cells(f'A{current_row}:K{current_row}')
        ws.cell(row=current_row, column=1).fill = header_fill
        ws.cell(row=current_row, column=1).font = header_font
        ws.cell(row=current_row, column=1).alignment = header_alignment
 
        # Write Table Fields headers
        current_row += 1
        for col, field in enumerate(TABLE_FIELDS, 1):
            cell = ws.cell(row=current_row, column=col)
            cell.value = field
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_alignment
            cell.border = border
 
        # Write table data
        for row_idx, row_data in enumerate(rows, current_row + 1):
            for col, field in enumerate(TABLE_FIELDS, 1):
                cell = ws.cell(row=row_idx, column=col)
                value = row_data.get(field, '')
                if field == 'primaryKey':
                    value = 'TRUE' if value else 'FALSE'
                cell.value = value
                cell.border = border
 
        # Adjust column widths (FIXED LOGIC)
        for col_idx in range(1, max(len(FORM_FIELDS), len(TABLE_FIELDS)) + 1):
            max_length = 0
            column_letter = get_column_letter(col_idx)  # Use get_column_letter directly instead of cell attribute
 
            # Check form headers (row 2)
            if col_idx <= len(FORM_FIELDS):
                header_value = ws.cell(row=2, column=col_idx).value
                if header_value:
                    max_length = max(max_length, len(str(header_value)))
               
                # Check form data (row 3)
                data_value = ws.cell(row=3, column=col_idx).value
                if data_value:
                    max_length = max(max_length, len(str(data_value)))
 
            # Check table headers (row 6)
            if col_idx <= len(TABLE_FIELDS):
                header_value = ws.cell(row=current_row, column=col_idx).value
                if header_value:
                    max_length = max(max_length, len(str(header_value)))
               
                # Check table data
                for row_idx in range(current_row + 1, current_row + 1 + len(rows)):
                    data_value = ws.cell(row=row_idx, column=col_idx).value
                    if data_value:
                        max_length = max(max_length, len(str(data_value)))
 
            # Set the column width
            adjusted_width = (max_length + 2)
            ws.column_dimensions[column_letter].width = adjusted_width
 
        # Save to BytesIO buffer
        excel_buffer = io.BytesIO()
        wb.save(excel_buffer)
        excel_buffer.seek(0)
 
        return send_file(
            excel_buffer,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='current_values.xlsx'
        )
    except Exception as e:
        print(f"Error in download_current: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/mapper/save', methods=['POST'])
def save_data():
    try:
        data = request.json
        is_draft = data.get('isDraft', False)
       
        # Generate unique mapper ID if not a draft and no ID exists
        if not is_draft and not data['formData'].get('mapperId'):
            data['formData']['mapperId'] = f"MAP_{uuid.uuid4().hex[:8].upper()}"

        # Create filename based on whether it's a draft
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{'draft_' if is_draft else ''}{data['formData'].get('reference', 'unnamed')}_{timestamp}.csv"
       
        # Save to appropriate directory
        save_dir = 'data/drafts' if is_draft else 'data'
        filepath = os.path.join(save_dir, filename)

        # Create form data DataFrame
        form_data = {field: [data['formData'].get(field, '')] for field in FORM_FIELDS}
        form_df = pd.DataFrame(form_data)

        # Create table data DataFrame
        table_data = []
        for row in data.get('rows', []):
            row_dict = {}
            for field in TABLE_FIELDS:
                if field == 'primaryKey':
                    # Convert boolean values to string representation
                    row_dict[field] = str(row.get(field, False)).lower()
                else:
                    row_dict[field] = str(row.get(field, ''))
            table_data.append(row_dict)
       
        table_df = pd.DataFrame(table_data) if table_data else pd.DataFrame(columns=TABLE_FIELDS)

        # Create a buffer to store the CSV
        buffer = io.StringIO()
       
        # Write form fields section with header
        buffer.write("# Form Fields\n")
        form_df.to_csv(buffer, index=False)
       
        # Add a separator
        buffer.write("\n# Table Fields\n")
       
        # Write table fields
        table_df.to_csv(buffer, index=False)
       
        # Write the final CSV file
        with open(filepath, 'w', newline='') as f:
            f.write(buffer.getvalue())
       
        buffer.close()
       
        return jsonify({
            'success': True,
            'mapperId': data['formData'].get('mapperId'),
            'filename': filename
        })
    except Exception as e:
        print(f"Error in save_data: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500
    
@app.route('/mapper/get-by-reference/<reference>', methods=['GET'])
def get_by_reference(reference):
    try:
        conn = create_oracle_connection()
        try:
            # Get reference data
            main_result = get_mapping_ref(conn, reference)
           
            if not main_result:
                return jsonify({
                    'exists': False,
                    'message': 'Reference not found or inactive. You can create a new mapping with this reference.'
                }), 404
           
            # Get mapping details
            details_result = get_mapping_details(conn, reference)
           
            # Format response
            form_data = {
                'reference': main_result['MAPREF'],
                'description': main_result['MAPDESC'] or '',
                'mapperId': str(main_result['MAPID']),
                'targetSchema': main_result['TRGSCHM'] or '',
                'tableName': main_result['TRGTBNM'] or '',
                'tableType': main_result['TRGTBTYP'] or '',
                'freqCode': main_result['FRQCD'] or '',
                'sourceSystem': main_result['SRCSYSTM'] or '',
                'bulkProcessRows': main_result['BLKPRCROWS'],
                'isReferenceDisabled': True
            }
           
            # Transform the details result into rows
            rows = []
            for row in details_result:
                row_data = {
                    'mapdtlid': str(row['MAPDTLID']),
                    'mapref': row['MAPREF'] or '',
                    'fieldName': row['TRGCLNM'] or '',
                    'dataType': row['TRGCLDTYP'] or '',
                    'primaryKey': row['TRGKEYFLG'] == 'Y',
                    'pkSeq': str(row['TRGKEYSEQ']) if row['TRGKEYSEQ'] is not None else '',
                    'fieldDesc': row['TRGCLDESC'] or '',
                    'logic': row['MAPLOGIC'] or '',
                    'keyColumn': row['KEYCLNM'] or '',
                    'valColumn': row['VALCLNM'] or '',
                    'mapCombineCode': row['MAPCMBCD'] or '',
                    'execSequence': str(row['EXCSEQ']) if row['EXCSEQ'] is not None else '',
                    'scdType': str(row['SCDTYP']) if row['SCDTYP'] is not None else '',
                    'LogicVerFlag': row['LGVRFYFLG']
                }
                rows.append(row_data)
           
            # If no detail rows exist, provide empty template rows
            if not rows:
                rows = [{
                    'mapdtlid': '',
                    'mapref': reference,
                    'fieldName': '',
                    'dataType': '',
                    'primaryKey': False,
                    'pkSeq': '',
                    'fieldDesc': '',
                    'logic': '',
                    'keyColumn': '',
                    'valColumn': '',
                    'mapCombineCode': '',
                    'execSequence': '',
                    'scdType': '',
                    'LogicVerFlag': ''
                } for _ in range(6)]
           
            response_data = {
                'exists': True,
                'formData': form_data,
                'rows': rows,
                'message': 'Mapping data retrieved successfully'
            }

            print(response_data)
            return jsonify(response_data)
        finally:
            conn.close()
           
    except Exception as e:
        print(f"Error in get_by_reference: {str(e)}")
        return jsonify({
            'error': 'An error occurred while retrieving the mapping data',
            'details': str(e)
        }), 500
 
 
@app.route('/mapper/save-to-db', methods=['POST'])
def save_to_db():
    try:
        data = request.json
        form_data = data['formData']
        rows = data['rows']
        print(form_data)
        modified_rows = data.get('modifiedRows', [])  # Track modified rows
        print(rows)
        print(modified_rows)
       
        conn = create_oracle_connection()
        try:
            # Oracle connections auto-commit unless explicitly started a transaction
            # No need to explicitly begin a transaction
           
            mapid = create_update_mapping(
                conn,
                form_data['reference'],
                form_data['description'],
                form_data['targetSchema'],
                form_data['tableType'],
                form_data['tableName'],
                form_data['freqCode'],#'WK',  # Use a valid frequency code
                form_data['sourceSystem'],
                'Y',  # Default to Y
                datetime.datetime.now(),
                'A' , # Default to Active
                form_data['bulkProcessRows'] #take this from frontend
            )
           
            processed_rows = []
            for row in rows:
                if not row['fieldName'].strip():
                    continue
               
                row_index = rows.index(row)
                if not (row_index in modified_rows or not row.get('mapdtlid')):
                    continue
                   
                # Set LogicVerFlag to "" if not defined
                logic_ver_flag = row.get('LogicVerFlag', "")  # Use "" if LogicVerFlag is not defined
 
                mapdtlid = create_update_mapping_detail(
                    conn,
                    form_data['reference'],
                    row['fieldName'],
                    row['dataType'],
                    'Y' if row['primaryKey'] else 'N',
                    row['pkSeq'] if row['pkSeq'] and row['primaryKey'] else None,
                    row['fieldDesc'],  # Optional description
                    row['logic'] if row['logic'].strip() else None,
                    row['keyColumn'],
                    row['valColumn'],
                    row['mapCombineCode'],
                    1,  # Default execution sequence
                    row['scdType'],  # Default SCD Type
                    logic_ver_flag,  # Use the defined logic_ver_flag
                    "" if logic_ver_flag == "" else datetime.datetime.now()  # Set to current time if not empty
                )
               
                processed_rows.append({
                    'index': row_index,
                    'mapdtlid': mapdtlid,
                    'fieldName': row['fieldName']
                })
           
            # Commit the transaction
            conn.commit()
           
            return jsonify({
                'success': True,
                'message': 'Mapping saved successfully',
                'mapperId': str(mapid),
                'processedRows': processed_rows
            })
           
        except Exception as e:
            # Rollback in case of error
            conn.rollback()
            raise e
        finally:
            # Close the connection
            conn.close()
 
    except oracledb.DatabaseError as e:
        # Extract the specific error message that starts with " " and ends with "."
        error_message = str(e)
        match = re.search(r'(?<=::)(.*?)(?=\.)', error_message)  # Look for text between "::" and "."
        specific_error = match.group(0).strip() if match else error_message  # Fallback to the full error message if no match
 
        return jsonify({
            'error': specific_error,
            'details': error_message
        }), 500
   
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"Error in save_to_db: {str(e)}\n{tb}")
        return jsonify({
            'error': f'An error occurred while saving the mapping data {str(e)}',
            'details': str(e)
        }), 500
# @app.route("/mapper/validate_all_logic", methods=['GET'])
# def validate_all_logic():
#     try:
#         p_mapref = request.args.get('p_mapref')  # Get p_mapref from query parameters
#         if not p_mapref:
#             return jsonify({'error': 'Missing required parameter: p_mapref'}), 400
       
#         connection = None
#         try:
#             connection = create_oracle_connection()
#             # Call the existing function
#             result, error_message = validate_all_mapping_details(connection, p_mapref)
           
#             return jsonify({
#                 'result': result,
#                 'error_message': error_message
#             })
#         finally:
#             if connection:
#                 connection.close()
#     except Exception as e:
#         print(f"Error in validate_all_logic: {str(e)}")
#         return jsonify({'error': 'An error occurred while validating mapping details', 'details': str(e)}), 500
 
# @app.route("/mapper/get_error_message/<map_detail_id>", methods=['GET'])
# def get_error_message(map_detail_id):
#     try:
#         conn = create_oracle_connection()
#         try:
#             error_message = get_error_massage(conn, map_detail_id)
           
#             # If no error message is returned, it means success
#             if error_message == "Logic is Verified":
#                 return jsonify({
#                     'status': 'success',
#                     'message': 'Logic is verified, no errors found.'
#                 })
#             else:
#                 return jsonify({
#                     'status': 'error',
#                     'message': error_message
#                 })
#         finally:
#             conn.close()
#     except Exception as e:
#         print(f"Error in get_error_message: {str(e)}")
#         return jsonify({
#             'error': 'An error occurred while retrieving the error message',
#             'details': str(e)
#         }), 500
 
@app.route('/mapper/validate-logic', methods=['POST'])
def validate_logic():
    try:
        data = request.json
        p_logic = data.get('p_logic')
        p_keyclnm = data.get('p_keyclnm')
        p_valclnm = data.get('p_valclnm')
       
        if not all([p_logic, p_keyclnm, p_valclnm]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required parameters. Please provide p_logic, p_keyclnm, and p_valclnm.'
            }), 400
       
        connection = None
        try:
            connection = create_oracle_connection()
           
            is_valid, error = validate_logic2(connection, p_logic, p_keyclnm, p_valclnm)
           
            return jsonify({
                'status': 'success',
                'is_valid': is_valid,
                'message': 'Logic is valid' if is_valid == 'Y' else error
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Error validating logic: {str(e)}'
            }), 500
        finally:
            if connection:
                connection.close()
               
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error processing request: {str(e)}'
        }), 500

 
@app.route("/job/jobs_list", methods=["GET"])
def jobs():
    try:
        conn = create_oracle_connection()
        try:
            job_list = get_job_list(conn)
           
            # Convert datetime objects to ISO format strings for JSON serialization
            for job in job_list:
                if 'RECCRDT' in job and job['RECCRDT']:
                    job['RECCRDT'] = job['RECCRDT'].isoformat()
                if 'RECUPDT' in job and job['RECUPDT']:
                    job['RECUPDT'] = job['RECUPDT'].isoformat()
            print(job_list)
           
            return jsonify(job_list)
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
 
@app.route("/job/view_mapping/<mapping_reference>")
def job_mapping_view(mapping_reference):
    try:
        conn = create_oracle_connection()
        try:
            # Get mapping reference and details data
            mapping_ref_data = get_mapping_ref(conn, reference=mapping_reference)
            mapping_detail_data = get_mapping_details(conn, reference=mapping_reference)
           
            # Prepare the response
            response_data = {
                "mapping_reference": mapping_ref_data,
                "mapping_details": mapping_detail_data
            }
            # print(response_data)
            print(response_data)
           
            return jsonify(response_data)
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
   
   
@app.route("/mapping/parameter_mapping", methods=["GET"])
def parameter_displat():
    try:
        conn = create_oracle_connection()
        try:
            parameter_data = get_parameter_mapping(conn)
            print(parameter_data)
            return jsonify(parameter_data)
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
 
 
@app.route("/mapping/parameter_add", methods=["POST"])
def add_parameter():
    try:
        data = request.json
        prtyp = data.get('PRTYP')
        prcd = data.get('PRCD')
        prdesc = data.get('PRDESC')
        prval = data.get('PRVAL')
        print(prtyp, prcd, prdesc, prval)
 
        if not all([prtyp, prcd, prdesc, prval]):
            return jsonify({"error": "All fields are required"}), 400
 
        conn = create_oracle_connection()
        try:
            add_parameter_mapping(conn, prtyp, prcd, prdesc, prval)
            return jsonify({"message": "Parameter mapping added successfully"}), 200
        finally:
            conn.close()
    except Exception as e:
        print(f"Error in add_parameter: {str(e)}")
        return jsonify({"error": str(e)}), 500



@app.route('/mapper/validate-batch', methods=['POST'])
def validate_batch_logic():
    try:
        data = request.json
        p_mapref = data.get('mapref')
        rows = data.get('rows', [])
       
        connection = create_oracle_connection()
        try:
            results = []
           
            # First validate all logic together
            bulk_result, bulk_error = validate_all_mapping_details(connection, p_mapref)
           
            # Collect all mapdtlids for batch error message retrieval
            map_detail_ids = [row.get('mapdtlid') for row in rows if row.get('mapdtlid') and row.get('logic')]
           
            # Get all error messages in a single batch
            error_messages = get_error_messages_list(connection, map_detail_ids)
           
            # Process results using error messages from get_error_messages_list
            for row in rows:
                if not row.get('logic'):
                    continue
               
                error_message = None
                if row.get('mapdtlid') and row.get('mapdtlid') in error_messages:
                    error_message = error_messages[row.get('mapdtlid')]
                   
                results.append({
                    'rowId': row.get('mapdtlid'),
                    'fieldName': row.get('fieldName'),
                    'isValid': error_message == "Logic is Verified",
                    'error': None if error_message == "Logic is Verified" else error_message,
                    'detailedError': error_message
                })
           
            return jsonify({
                'status': 'success',
                'bulkValidation': {
                    'success': bulk_result,
                    'error': bulk_error
                },
                'rowResults': results
            })
           
        finally:
            connection.close()
           
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/mapper/get-parameter-mapping-datatype', methods=['GET'])
def get_parameter_mapping_datatype_api():
    try:
        conn = create_oracle_connection()
        return jsonify(get_parameter_mapping_datatype(conn))
    except Exception as e:
        print(f"Error in get_parameter_mapping_datatype: {str(e)}")
        return jsonify({'error': str(e)}), 500
 
@app.route('/mapper/parameter_scd_type', methods=["GET"])
def parameter_scd_type():
    try:
        conn = create_oracle_connection()
        try:
            parameter_data = get_parameter_mapping_scd_type(conn)
            return jsonify(parameter_data)
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/mapper/activate-deactivate', methods=['POST'])
def activate_deactivate_mapping():
    try:
        data = request.json
        p_mapref = data.get('mapref')
        p_stflg = data.get('statusFlag')
        
        if not p_mapref or not p_stflg:
            return jsonify({
                'success': False,
                'message': 'Missing required parameters. Please provide mapref and statusFlag.'
            }), 400
            
        if p_stflg not in ['A', 'N']:
            return jsonify({
                'success': False,
                'message': 'Invalid status flag. Must be either "A" (activate) or "N" (deactivate).'
            }), 400
            
        conn = create_oracle_connection()
        try:
            success, message = call_activate_deactivate_mapping(conn, p_mapref, p_stflg)
            return jsonify({
                'success': success,
                'message': message
            })
        finally:
            conn.close()
            
    except Exception as e:
        print(f"Error in activate_deactivate_mapping: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'An error occurred while processing the request: {str(e)}'
        }), 500

@app.route('/job/create-update', methods=['POST'])
def create_update_job():
    try:
        data = request.json
        p_mapref = data.get('mapref')
        
        if not p_mapref:
            return jsonify({
                'success': False,
                'message': 'Missing required parameter: mapref'
            }), 400
            
        conn = create_oracle_connection()
        try:
            job_id, error_message = call_create_update_job(conn, p_mapref)
            
            if error_message:
                return jsonify({
                    'success': False,
                    'message': error_message
                }), 500
                
            return jsonify({
                'success': True,
                'message': 'Job created/updated successfully',
                'job_id': job_id
            })
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"Error in create_update_job: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'An error occurred while processing the request: {str(e)}'
        }), 500

@app.route('/api/license/status', methods=['GET'])
def get_license_status():
    """Get license status without requiring authentication"""
    status = license_manager.get_license_status()
    response = jsonify(status)
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/admin/license/activate', methods=['POST'])
@token_required
@admin_required
def activate_license(current_user_id):  # Add current_user_id parameter
    data = request.get_json()
    license_key = data.get('license_key')
    
    if not license_key:
        return jsonify({
            'success': False,
            'message': 'License key is required'
        }), 400
        
    success, message = license_manager.activate_license(license_key)
    return jsonify({
        'success': success,
        'message': message
    })

@app.route('/api/admin/license/deactivate', methods=['POST'])
@token_required
@admin_required
def deactivate_license(current_user_id):  # Add current_user_id parameter
    success, message = license_manager.deactivate_license()
    return jsonify({
        'success': success,
        'message': message
    })

# Add CORS preflight handler
@app.route('/api/license/status', methods=['OPTIONS'])
def handle_license_status_preflight():
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)   
 