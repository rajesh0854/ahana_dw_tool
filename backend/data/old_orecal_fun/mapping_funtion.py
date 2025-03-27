from sqlalchemy import  text
import oracledb
def create_update_mapping(connection, p_mapref, p_mapdesc, p_trgschm, p_trgtbtyp, 
                          p_trgtbnm, p_frqcd, p_srcsystm, p_lgvrfyflg, p_lgvrfydt, p_stflg):
    """
    Creates or updates a mapping using MAP.PKGDWMAPR.CREATE_UPDATE_MAPPING
    
    Args:
        connection: Oracle connection object
        p_mapref: Mapping reference
        p_mapdesc: Mapping description
        p_trgschm: Target schema
        p_trgtbtyp: Target table type
        p_trgtbnm: Target table name
        p_frqcd: Frequency code
        p_srcsystm: Source system
        p_lgvrfyflg: Logic verification flag
        p_lgvrfydt: Logic verification date
        p_stflg: Status flag
        
    Returns:
        Mapping ID
    """
    create_mapping = text("""
        BEGIN
            :mapid := MAP.PKGDWMAPR.CREATE_UPDATE_MAPPING(
                :p_mapref, :p_mapdesc, :p_trgschm, :p_trgtbtyp,
                :p_trgtbnm, :p_frqcd, :p_srcsystm, :p_lgvrfyflg,
                :p_lgvrfydt, :p_stflg
            );
        END;
    """)
    
    params = {
        'p_mapref': p_mapref,
        'p_mapdesc': p_mapdesc,
        'p_trgschm': p_trgschm,
        'p_trgtbtyp': p_trgtbtyp,
        'p_trgtbnm': p_trgtbnm,
        'p_frqcd': p_frqcd,
        'p_srcsystm': p_srcsystm,
        'p_lgvrfyflg': p_lgvrfyflg,
        'p_lgvrfydt': p_lgvrfydt,
        'p_stflg': p_stflg,
        'mapid': 0  # Output parameter initialized to 0
    }

    result = connection.execute(create_mapping, params)
    return params['mapid']

def create_update_mapping_detail(connection, p_mapref, p_trgclnm, p_trgcldtyp, p_trgpkflg, 
                                 p_trgpkseq, p_trgcldesc, p_trgnflg, p_maplogic, p_keyclnm, 
                                 p_valclnm, p_mapcmbcd, p_excseq, p_scdtyp, p_lgvrfyflg, p_lgvrfydt):
    """
    Creates or updates a mapping detail using MAP.PKGDWMAPR.CREATE_UPDATE_MAPPING_DETAIL
    
    Args:
        connection: Oracle connection object
        p_mapref: Mapping reference (must exist)
        p_trgclnm: Target column name
        p_trgcldtyp: Target column data type
        p_trgpkflg: Is primary key (Y/N)
        p_trgpkseq: Primary key sequence
        p_trgcldesc: Column description
        p_trgnflg: Not nullable flag (Y/N)
        p_maplogic: Mapping logic (SQL)
        p_keyclnm: Key column name
        p_valclnm: Value column name
        p_mapcmbcd: Mapping combination code
        p_excseq: Execution sequence
        p_scdtyp: SCD Type
        p_lgvrfyflg: Logic verification flag (Y/N)
        p_lgvrfydt: Logic verification date
        
    Returns:
        Mapping detail ID
    """
    create_detail = text("""
        BEGIN
            :mapdtlid := MAP.PKGDWMAPR.CREATE_UPDATE_MAPPING_DETAIL(
                :p_mapref, :p_trgclnm, :p_trgcldtyp,
                :p_trgpkflg, :p_trgpkseq, :p_trgcldesc,
                :p_trgnflg, :p_maplogic, :p_keyclnm,
                :p_valclnm, :p_mapcmbcd, :p_excseq,
                :p_scdtyp, :p_lgvrfyflg, :p_lgvrfydt
            );
        END;
    """)
    
    detail_params = {
        'p_mapref': p_mapref,
        'p_trgclnm': p_trgclnm,
        'p_trgcldtyp': p_trgcldtyp,
        'p_trgpkflg': p_trgpkflg,
        'p_trgpkseq': p_trgpkseq,
        'p_trgcldesc': p_trgcldesc,
        'p_trgnflg': p_trgnflg,
        'p_maplogic': p_maplogic,
        'p_keyclnm': p_keyclnm,
        'p_valclnm': p_valclnm,
        'p_mapcmbcd': p_mapcmbcd,
        'p_excseq': p_excseq,
        'p_scdtyp': p_scdtyp,
        'p_lgvrfyflg': p_lgvrfyflg,
        'p_lgvrfydt': p_lgvrfydt,
        'mapdtlid': 0  # Output parameter initialized to 0
    }
    print(detail_params)

    result = connection.execute(create_detail, detail_params)
    return detail_params['mapdtlid']

def validate_logic_in_db(connection, p_logic, p_keyclnm, p_valclnm):
    """
    Validates the logic using MAP.PKGDWMAPR.VALIDATE_LOGIC
    
    Args:
        connection: Oracle connection object
        p_logic: Logic to validate
        p_keyclnm: Key column name
        p_valclnm: Value column name
        
    Returns:
        Validation result (Y/N)
    """
    cursor = connection.cursor()
    v_is_valid = cursor.var(oracledb.STRING)
    
    sql = """
    BEGIN
        :result := MAP.PKGDWMAPR.VALIDATE_LOGIC(
            p_logic => :p_logic,
            p_keyclnm => :p_keyclnm,
            p_valclnm => :p_valclnm
        );
    END;
    """
    
    cursor.execute(
        sql,
        result=v_is_valid,
        p_logic=p_logic,
        p_keyclnm=p_keyclnm,
        p_valclnm=p_valclnm
    )
    connection.commit()
    
    return v_is_valid.getvalue()



def validate_logic2(connection, p_logic, p_keyclnm, p_valclnm):
    """
    Validates SQL logic using MAP.PKGDWMAPR.VALIDATE_LOGIC2
    
    Args:
        connection: Oracle connection object
        p_logic: SQL logic to validate
        p_keyclnm: Key column name
        p_valclnm: Value column name
    
    Returns:
        Tuple: (Validation result (Y/N), Error message if any)
    """
    cursor = None
    try:
        cursor = connection.cursor()
        
        # Define the output parameters
        v_is_valid = cursor.var(oracledb.STRING)
        v_error = cursor.var(oracledb.STRING, 4000)  # Error output parameter
        
        # SQL to execute with named parameters
        sql = """
        BEGIN
            :result := MAP.PKGDWMAPR.VALIDATE_LOGIC2(
                p_logic => :p_logic,
                p_keyclnm => :p_keyclnm,
                p_valclnm => :p_valclnm,
                p_err => :p_err
            );
        END;
        """
        
        # Execute with named parameters
        cursor.execute(
            sql,
            result=v_is_valid,
            p_logic=p_logic,
            p_keyclnm=p_keyclnm,
            p_valclnm=p_valclnm,
            p_err=v_error
        )
        connection.commit()
        
        # Get the results
        is_valid = v_is_valid.getvalue()
        error_message = v_error.getvalue()
        
        return is_valid, error_message
    
    except Exception as e:
        print(f"Error validating logic: {str(e)}")
        raise
    
    finally:
        if cursor:
            cursor.close()
