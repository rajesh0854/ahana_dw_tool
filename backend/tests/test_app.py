import pytest
from flask import Flask
from app import app
import io
import datetime

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_download_template(client):
    response = client.get('/mapper/download-template')
    assert response.status_code == 200
    assert response.headers['Content-Type'].startswith('text/csv')
    assert 'attachment; filename=mapper_template.csv' in response.headers['Content-Disposition']

def test_upload_file(client):
    data = {
        'file': (io.BytesIO(b"# Form Fields\nreference,description,mapperId,targetSchema,tableName,tableType,freqCode,sourceSystem,logicVerified\n\n# Table Fields\nmapdtlid,mapref,fieldName,dataType,primaryKey,pkSeq,fieldDesc,nulls,logic,keyColumn,valColumn,mapCombineCode,execSequence,scdType,logicVerified\n"), 'test.csv')
    }
    response = client.post('/mapper/upload', content_type='multipart/form-data', data=data)
    assert response.status_code == 200
    assert 'formData' in response.json
    assert 'rows' in response.json

def test_save_data(client):
    data = {
        'formData': {
            'reference': 'test_ref',
            'description': 'test_desc',
            'mapperId': '',
            'targetSchema': 'test_schema',
            'tableName': 'test_table',
            'tableType': 'NRM',  # Use a valid table type
            'freqCode': 'WK',  # Use a valid frequency code
            'sourceSystem': 'test_system',
            'logicVerified': 'Y'
        },
        'rows': [
            {
                'mapdtlid': '',
                'mapref': 'test_ref',
                'fieldName': 'test_field',
                'dataType': 'VARCHAR2',
                'primaryKey': False,
                'pkSeq': '',
                'fieldDesc': '',
                'nulls': False,
                'logic': '',
                'keyColumn': '',
                'valColumn': '',
                'mapCombineCode': '',
                'execSequence': '',
                'scdType': '',
                'logicVerified': False
            }
        ],
        'isDraft': True
    }
    response = client.post('/mapper/save', json=data)
    assert response.status_code == 200
    assert response.json['success'] is True

# ...existing code...

def test_save_to_db(client):
    data = {
        'formData': {
            'reference': 'test_ref',
            'description': 'test_desc',
            'mapperId': '',
            'targetSchema': 'test_schema',
            'tableName': 'test_table',
            'tableType': 'NRM',  # Use a valid table type
            'freqCode': 'WK',  # Use a valid frequency code
            'sourceSystem': 'test_system',
            'logicVerified': 'Y'
        },
        'rows': [
            {
                'mapdtlid': '',
                'mapref': 'test_ref',
                'fieldName': 'test_field',
                'dataType': 'VARCHAR2',
                'primaryKey': False,
                'pkSeq': '',
                'fieldDesc': '',
                'nulls': False,
                'logic': '',
                'keyColumn': '',
                'valColumn': '',
                'mapCombineCode': '',
                'execSequence': '',
                'scdType': '',
                'logicVerified': False
            }
        ],
        'modifiedRows': [0]
    }
    response = client.post('/mapper/save-to-db', json=data)
    assert response.status_code == 200
    assert response.json['success'] is True


def test_get_by_reference(client):
    reference = 'test_ref'
    response = client.get(f'/mapper/get-by-reference/{reference}')
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        assert 'formData' in response.json
        assert 'rows' in response.json


def test_validate_logic(client):
    data = {
        'p_logic': 'SELECT * FROM test_table',
        'p_keyclnm': 'test_key',
        'p_valclnm': 'test_val'
    }
    response = client.post('/mapper/validate-logic', json=data)
    assert response.status_code == 200
    assert 'is_valid' in response.json

def test_download_current(client):
    data = {
        'formData': {
            'reference': 'test_ref',
            'description': 'test_desc',
            'mapperId': '',
            'targetSchema': 'test_schema',
            'tableName': 'test_table',
            'tableType': 'NRM',  # Use a valid table type
            'freqCode': 'test_freq',
            'sourceSystem': 'test_system',
            'logicVerified': 'Y'
        },
        'rows': [
            {
                'mapdtlid': '',
                'mapref': 'test_ref',
                'fieldName': 'test_field',
                'dataType': 'VARCHAR2',
                'primaryKey': False,
                'pkSeq': '',
                'fieldDesc': '',
                'nulls': False,
                'logic': '',
                'keyColumn': '',
                'valColumn': '',
                'mapCombineCode': '',
                'execSequence': '',
                'scdType': '',
                'logicVerified': False
            }
        ]
    }
    response = client.post('/mapper/download-current', json=data)
    assert response.status_code == 200
    assert response.headers['Content-Type'].startswith('text/csv')
    assert 'attachment; filename=current_values.csv' in response.headers['Content-Disposition']
