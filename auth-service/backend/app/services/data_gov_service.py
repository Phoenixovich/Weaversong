import httpx
import google.generativeai as genai
from app.config import settings
from typing import List, Dict, Optional, Tuple
import json
import csv
import io
import zipfile
import pandas as pd
import tempfile
import os

# Configure Gemini API
genai.configure(api_key=settings.gemini_api_key)

# Base URL for data.gov.ro API
DATA_GOV_BASE_URL = "https://data.gov.ro/api/3/action"


async def fetch_datasets(search_query: Optional[str] = None, limit: int = 20) -> List[Dict]:
    """
    Fetch datasets from data.gov.ro
    """
    try:
        async with httpx.AsyncClient() as client:
            if search_query:
                # Search datasets
                url = f"{DATA_GOV_BASE_URL}/package_search"
                params = {"q": search_query, "rows": limit}
                response = await client.get(url, params=params, timeout=10.0)
            else:
                # List all datasets
                url = f"{DATA_GOV_BASE_URL}/package_list"
                response = await client.get(url, timeout=10.0)
            
            response.raise_for_status()
            data = response.json()
            
            if search_query:
                # package_search returns results in data.result.results
                return data.get("result", {}).get("results", [])
            else:
                # package_list returns just a list of package names
                package_names = data.get("result", [])
                # Fetch details for each package (limited to first 'limit' packages)
                packages = []
                for name in package_names[:limit]:
                    try:
                        package_url = f"{DATA_GOV_BASE_URL}/package_show"
                        package_response = await client.get(
                            package_url, 
                            params={"id": name}, 
                            timeout=5.0
                        )
                        if package_response.status_code == 200:
                            package_data = package_response.json()
                            packages.append(package_data.get("result", {}))
                    except Exception:
                        continue
                return packages
    except Exception as e:
        raise Exception(f"Error fetching datasets: {str(e)}")


async def get_dataset_details(package_id: str) -> Dict:
    """
    Get detailed information about a specific dataset
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{DATA_GOV_BASE_URL}/package_show"
            params = {"id": package_id}
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return data.get("result", {})
    except Exception as e:
        raise Exception(f"Error fetching dataset details: {str(e)}")


async def explain_alert(alert_text: str, model_name: str = 'gemini-2.5-flash') -> str:
    """
    Explain a RO-ALERT message in plain language using Gemini
    """
    model = genai.GenerativeModel(model_name)
    
    prompt = f"""You are a public safety assistant helping Romanian citizens understand government alerts and emergency messages.

Translate the following RO-ALERT or emergency message into clear, everyday Romanian language that anyone can understand.

Start your answer right away with no intro.

Organize the response into:
1. **What's Happening** - A simple explanation of the alert
2. **What You Should Do** - Clear action steps
3. **Important Safety Tips** - Specific safety measures
4. **When to Seek Help** - When and how to get assistance

Use simple words, short sentences, and bullet points. Be direct and practical.

Alert message:
{alert_text}"""
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Error explaining alert: {str(e)}")


async def explain_social_aid(question: str, context: Optional[str] = None, model_name: str = 'gemini-2.5-flash') -> str:
    """
    Explain social aid eligibility and benefits in simple terms
    """
    model = genai.GenerativeModel(model_name)
    
    base_context = """
    Venitul Minim de Incluziune (VMI) is Romania's minimum inclusion income program. 
    It provides financial support to families and individuals in need.
    """
    
    full_context = f"{base_context}\n\n{context}" if context else base_context
    
    prompt = f"""You are a social assistance advisor helping Romanian citizens understand social benefits and eligibility.

Answer the following question about social aid in clear, simple Romanian language.

Provide:
1. **Direct Answer** - A clear yes/no or explanation
2. **Eligibility Requirements** - What conditions must be met
3. **How to Apply** - Simple steps to apply
4. **Important Notes** - Key things to remember

Use simple words and be practical. If you don't have specific information, say so clearly.

Context about social aid in Romania:
{full_context}

Question:
{question}"""
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Error explaining social aid: {str(e)}")


async def datastore_search(
    resource_id: str,
    limit: int = 100,
    offset: int = 0,
    filters: Optional[Dict] = None,
    q: Optional[str] = None,
    sort: Optional[str] = None
) -> Dict:
    """
    Search data.gov.ro datastore using resource_id
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{DATA_GOV_BASE_URL}/datastore_search"
            params = {
                "resource_id": resource_id,
                "limit": limit,
                "offset": offset
            }
            
            if filters:
                params["filters"] = json.dumps(filters)
            
            if q:
                params["q"] = q
            
            if sort:
                params["sort"] = sort
            
            response = await client.get(url, params=params, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            return data.get("result", {})
    except Exception as e:
        raise Exception(f"Error searching datastore: {str(e)}")


async def datastore_search_sql(sql_query: str) -> Dict:
    """
    Search data.gov.ro datastore using SQL query
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{DATA_GOV_BASE_URL}/datastore_search_sql"
            params = {"sql": sql_query}
            response = await client.get(url, params=params, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            return data.get("result", {})
    except Exception as e:
        raise Exception(f"Error executing SQL query: {str(e)}")


async def get_resource_info(resource_id: str) -> Dict:
    """
    Get information about a datastore resource
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{DATA_GOV_BASE_URL}/datastore_search"
            params = {"resource_id": resource_id, "limit": 1}
            response = await client.get(url, params=params, timeout=10.0)
            
            if response.status_code == 404:
                raise Exception(
                    f"Resource '{resource_id}' is not available in the datastore. "
                    "Not all resources are queryable via the datastore API. "
                    "Some resources are only available as downloadable files. "
                    "Please check the dataset details to find resources that are in the datastore, "
                    "or try a different resource ID."
                )
            
            response.raise_for_status()
            data = response.json()
            result = data.get("result", {})
            
            # Extract field information from first result
            fields = result.get("fields", [])
            total = result.get("total", 0)
            
            if not fields:
                raise Exception(
                    f"Resource '{resource_id}' exists but has no fields. "
                    "This resource may not be properly configured in the datastore."
                )
            
            return {
                "resource_id": resource_id,
                "fields": fields,
                "total_records": total,
                "sample": result.get("records", [])[:1] if result.get("records") else []
            }
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise Exception(
                f"Resource '{resource_id}' is not available in the datastore. "
                "Not all resources are queryable via the datastore API. "
                "Please check the dataset details to find resources that are in the datastore."
            )
        raise Exception(f"Error getting resource info: HTTP {e.response.status_code} - {e.response.text[:200]}")
    except Exception as e:
        error_msg = str(e)
        if "not available in the datastore" in error_msg:
            raise
        raise Exception(f"Error getting resource info: {error_msg}")


async def check_resource_in_datastore(resource_id: str) -> bool:
    """
    Check if a resource is available in the datastore
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{DATA_GOV_BASE_URL}/datastore_search"
            params = {"resource_id": resource_id, "limit": 1}
            response = await client.get(url, params=params, timeout=5.0)
            return response.status_code == 200
    except Exception:
        return False


async def get_predefined_resource_ids() -> List[Dict]:
    """
    Get a list of predefined resource IDs from popular datasets for testing
    Only includes resources that are actually available in the datastore
    """
    predefined = []
    
    try:
        # Search for popular datasets and extract their resource IDs
        popular_searches = [
            ("RO-ALERT", "RO-ALERT Messages"),
            ("VMI venit minim", "VMI Beneficiaries"),
            ("budget execution", "Budget Execution"),
            ("firefighters interventions", "Firefighters Interventions"),
            ("social assistance", "Social Assistance"),
        ]
        
        for search_term, label in popular_searches:
            try:
                datasets = await fetch_datasets(search_query=search_term, limit=5)
                for dataset in datasets:
                    resources = dataset.get('resources', [])
                    for resource in resources:
                        resource_id = resource.get('id')
                        if resource_id:
                            # Check if this resource is actually in the datastore
                            is_in_datastore = await check_resource_in_datastore(resource_id)
                            if is_in_datastore:
                                predefined.append({
                                    "id": resource_id,
                                    "name": f"{label} - {dataset.get('title', 'Unknown')}",
                                    "description": dataset.get('notes', '')[:100] if dataset.get('notes') else '',
                                    "dataset_title": dataset.get('title', 'Unknown'),
                                })
                                break  # Only take first valid resource from each dataset
            except Exception:
                continue  # Skip if search fails
        
        # If we didn't find any, add some known working examples (if available)
        # These are example resource IDs that users can try
        if not predefined:
            # Try to find any working resource from recent datasets
            try:
                recent_datasets = await fetch_datasets(limit=20)
                for dataset in recent_datasets:
                    resources = dataset.get('resources', [])
                    for resource in resources:
                        resource_id = resource.get('id')
                        if resource_id and len(predefined) < 5:
                            is_in_datastore = await check_resource_in_datastore(resource_id)
                            if is_in_datastore:
                                predefined.append({
                                    "id": resource_id,
                                    "name": f"{dataset.get('title', 'Unknown')}",
                                    "description": dataset.get('notes', '')[:100] if dataset.get('notes') else '',
                                    "dataset_title": dataset.get('title', 'Unknown'),
                                })
                                if len(predefined) >= 5:
                                    break
                    if len(predefined) >= 5:
                        break
            except Exception:
                pass
        
        return predefined[:10]  # Limit to 10 resources
    except Exception as e:
        # Return empty list if error
        return []


async def search_ro_alert_datasets() -> List[Dict]:
    """
    Search for RO-ALERT related datasets
    """
    return await fetch_datasets(search_query="RO-ALERT alert", limit=10)


async def search_social_aid_datasets() -> List[Dict]:
    """
    Search for social aid related datasets (VMI, etc.)
    """
    return await fetch_datasets(search_query="VMI venit minim incluziune social", limit=10)


async def fetch_dataset_resource_binary(resource_url: str, max_size: int = 10 * 1024 * 1024) -> bytes:
    """
    Fetch a dataset resource as binary data (for ZIP, Excel, etc.)
    Limits to max_size bytes to avoid memory issues
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(resource_url, timeout=60.0, follow_redirects=True)
            response.raise_for_status()
            
            # Check content length
            content_length = response.headers.get('content-length')
            if content_length and int(content_length) > max_size:
                raise Exception(f"Resource too large ({content_length} bytes). Maximum size: {max_size} bytes")
            
            # Read binary content
            content = response.content
            
            # Check actual size
            if len(content) > max_size:
                raise Exception(f"Resource too large ({len(content)} bytes). Maximum size: {max_size} bytes")
            
            if not content or len(content) == 0:
                raise Exception("Resource is empty or contains no data")
            
            return content
    except httpx.HTTPStatusError as e:
        raise Exception(f"HTTP error fetching resource: {e.response.status_code} - {e.response.text[:200]}")
    except httpx.TimeoutException:
        raise Exception("Timeout while fetching resource. The resource may be too large or the server is slow.")
    except Exception as e:
        error_msg = str(e)
        if "Resource too large" in error_msg or "empty" in error_msg.lower():
            raise
        raise Exception(f"Error fetching resource from {resource_url}: {error_msg}")


async def fetch_dataset_resource(resource_url: str, max_size: int = 5 * 1024 * 1024) -> str:
    """
    Fetch a dataset resource (CSV, JSON, etc.) and return as text
    Limits to max_size bytes to avoid memory issues
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(resource_url, timeout=30.0, follow_redirects=True)
            response.raise_for_status()
            
            # Check content length
            content_length = response.headers.get('content-length')
            if content_length and int(content_length) > max_size:
                raise Exception(f"Resource too large ({content_length} bytes). Maximum size: {max_size} bytes")
            
            # Read content
            content = response.text
            
            # Check actual size
            if len(content.encode('utf-8')) > max_size:
                # Truncate to max_size
                content = content[:max_size]
            
            if not content or not content.strip():
                raise Exception("Resource is empty or contains no data")
            
            return content
    except httpx.HTTPStatusError as e:
        raise Exception(f"HTTP error fetching resource: {e.response.status_code} - {e.response.text[:200]}")
    except httpx.TimeoutException:
        raise Exception("Timeout while fetching resource. The resource may be too large or the server is slow.")
    except Exception as e:
        error_msg = str(e)
        if "Resource too large" in error_msg or "empty" in error_msg.lower():
            raise
        raise Exception(f"Error fetching resource from {resource_url}: {error_msg}")


def parse_csv_sample(csv_content: str, max_rows: int = 100) -> Dict:
    """
    Parse CSV content and return a sample with structure info
    """
    try:
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        rows = []
        headers = None
        
        for i, row in enumerate(csv_reader):
            if i == 0:
                headers = list(row.keys())
            if i >= max_rows:
                break
            rows.append(row)
        
        return {
            "format": "csv",
            "headers": headers,
            "row_count": len(rows),
            "sample_rows": rows[:10],  # First 10 rows
            "total_estimated_rows": len(csv_content.split('\n')) - 1  # Rough estimate
        }
    except Exception as e:
        raise Exception(f"Error parsing CSV: {str(e)}")


async def extract_zip_and_find_data(zip_bytes: bytes) -> Tuple[str, str]:
    """
    Extract ZIP file and find the first Excel or CSV file inside
    Returns (file_content_as_text, format)
    """
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path = os.path.join(temp_dir, 'archive.zip')
            with open(zip_path, 'wb') as f:
                f.write(zip_bytes)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # List all files in the ZIP
                file_list = zip_ref.namelist()
                
                # Look for Excel or CSV files
                excel_files = [f for f in file_list if f.lower().endswith(('.xlsx', '.xls'))]
                csv_files = [f for f in file_list if f.lower().endswith('.csv')]
                
                # Prefer Excel files, then CSV
                target_file = None
                file_format = None
                
                if excel_files:
                    target_file = excel_files[0]
                    file_format = 'xlsx' if target_file.lower().endswith('.xlsx') else 'xls'
                elif csv_files:
                    target_file = csv_files[0]
                    file_format = 'csv'
                else:
                    # If no Excel/CSV found, try the first file
                    if file_list:
                        target_file = file_list[0]
                        file_format = 'unknown'
                    else:
                        raise Exception("ZIP file is empty")
                
                # Extract the file
                extracted_path = zip_ref.extract(target_file, temp_dir)
                
                # Read the file
                if file_format in ['xlsx', 'xls']:
                    # Read Excel file using pandas
                    df = pd.read_excel(extracted_path, engine='openpyxl' if file_format == 'xlsx' else None, nrows=1000)
                    # Convert to CSV-like string for analysis
                    csv_string = df.to_csv(index=False)
                    return csv_string, file_format
                elif file_format == 'csv':
                    with open(extracted_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    return content, 'csv'
                else:
                    # Try to read as text
                    with open(extracted_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    return content, 'unknown'
                    
    except zipfile.BadZipFile:
        raise Exception("File is not a valid ZIP archive")
    except Exception as e:
        raise Exception(f"Error extracting ZIP file: {str(e)}")


def parse_excel_sample(excel_content: str, max_rows: int = 100) -> Dict:
    """
    Parse Excel content (already converted to CSV string) and return structure info
    """
    try:
        csv_reader = csv.DictReader(io.StringIO(excel_content))
        rows = []
        headers = None
        
        for i, row in enumerate(csv_reader):
            if i == 0:
                headers = list(row.keys())
            if i >= max_rows:
                break
            rows.append(row)
        
        return {
            "format": "excel",
            "headers": headers,
            "row_count": len(rows),
            "sample_rows": rows[:10],  # First 10 rows
            "total_estimated_rows": len(excel_content.split('\n')) - 1  # Rough estimate
        }
    except Exception as e:
        raise Exception(f"Error parsing Excel data: {str(e)}")


def parse_json_sample(json_content: str) -> Dict:
    """
    Parse JSON content and return a sample with structure info
    """
    try:
        data = json.loads(json_content)
        
        if isinstance(data, list):
            return {
                "format": "json",
                "type": "array",
                "item_count": len(data),
                "sample_items": data[:10] if len(data) > 10 else data,
                "structure": list(data[0].keys()) if data and isinstance(data[0], dict) else None
            }
        elif isinstance(data, dict):
            return {
                "format": "json",
                "type": "object",
                "keys": list(data.keys()),
                "sample": {k: str(v)[:200] for k, v in list(data.items())[:10]}  # First 10 keys, truncated values
            }
        else:
            return {
                "format": "json",
                "type": "primitive",
                "value": str(data)[:500]
            }
    except Exception as e:
        raise Exception(f"Error parsing JSON: {str(e)}")


async def analyze_dataset_data(
    dataset_info: Dict,
    resource_data: str,
    resource_format: str,
    model_name: str = 'gemini-2.5-flash'
) -> str:
    """
    Use Gemini to analyze dataset data and create an aggregated summary
    """
    model = genai.GenerativeModel(model_name)
    
    # Prepare data summary for Gemini
    data_summary = ""
    format_lower = resource_format.lower()
    if format_lower == 'csv':
        parsed = parse_csv_sample(resource_data)
        data_summary = f"""
CSV Structure:
- Headers: {', '.join(parsed.get('headers', []))}
- Sample rows (first 10): {json.dumps(parsed.get('sample_rows', []), ensure_ascii=False, indent=2)}
- Estimated total rows: {parsed.get('total_estimated_rows', 'unknown')}
"""
    elif format_lower in ['xlsx', 'xls']:
        parsed = parse_excel_sample(resource_data)
        data_summary = f"""
Excel Structure:
- Headers: {', '.join(parsed.get('headers', []))}
- Sample rows (first 10): {json.dumps(parsed.get('sample_rows', []), ensure_ascii=False, indent=2)}
- Estimated total rows: {parsed.get('total_estimated_rows', 'unknown')}
"""
    elif format_lower == 'json':
        parsed = parse_json_sample(resource_data)
        data_summary = f"""
JSON Structure:
{json.dumps(parsed, ensure_ascii=False, indent=2)}
"""
    else:
        # For other formats, just send a sample
        data_summary = f"Data sample (first 2000 characters):\n{resource_data[:2000]}"
    
    prompt = f"""You are a data analyst helping Romanian citizens understand public datasets.

Analyze the following dataset and provide a clear, aggregated summary in Romanian language.

Dataset Information:
- Title: {dataset_info.get('title', 'Unknown')}
- Description: {dataset_info.get('notes', 'No description')}

{data_summary}

Provide an aggregated analysis with:
1. **Overview** - What this dataset contains
2. **Key Insights** - Important patterns, trends, or findings
3. **Key Statistics** - Important numbers, totals, averages, or notable values
4. **What This Means** - Practical implications for citizens
5. **Data Quality Notes** - Any observations about completeness or quality

Use simple language, bullet points, and be specific with numbers when available.
Format your response in markdown.

Analysis:"""
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Error analyzing dataset: {str(e)}")


async def get_dataset_aggregated_view(package_id: str, resource_index: int = 0, model_name: str = 'gemini-2.5-flash') -> Dict:
    """
    Get an aggregated view of a dataset by fetching and analyzing its data
    """
    try:
        # Get dataset details
        dataset = await get_dataset_details(package_id)
        
        if not dataset:
            raise Exception("Dataset not found")
        
        # Get resources
        resources = dataset.get('resources', [])
        if not resources:
            raise Exception("No resources available for this dataset")
        
        if resource_index >= len(resources):
            resource_index = 0
        
        resource = resources[resource_index]
        resource_url = resource.get('url')
        resource_format = resource.get('format', '').lower()
        
        if not resource_url:
            raise Exception("Resource URL not available")
        
        # Check if format is supported
        supported_formats = ['csv', 'json', 'txt', 'xml', 'zip', 'xlsx', 'xls']
        if resource_format not in supported_formats and resource_format:
            # Log but continue - might still be parseable
            print(f"Warning: Unsupported format '{resource_format}', attempting to fetch anyway")
        
        # Handle ZIP files - extract and find Excel/CSV inside
        actual_format = resource_format
        resource_data = None
        
        if resource_format == 'zip':
            try:
                # Fetch as binary
                zip_bytes = await fetch_dataset_resource_binary(resource_url, max_size=10 * 1024 * 1024)
                # Extract and get the first Excel/CSV file
                resource_data, actual_format = await extract_zip_and_find_data(zip_bytes)
                print(f"Extracted {actual_format} file from ZIP")
            except Exception as zip_error:
                raise Exception(f"Failed to extract ZIP file: {str(zip_error)}")
        elif resource_format in ['xlsx', 'xls']:
            try:
                # Fetch Excel file as binary
                excel_bytes = await fetch_dataset_resource_binary(resource_url, max_size=10 * 1024 * 1024)
                # Convert to CSV string using pandas
                with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx' if resource_format == 'xlsx' else '.xls') as tmp_file:
                    tmp_file.write(excel_bytes)
                    tmp_path = tmp_file.name
                
                try:
                    df = pd.read_excel(tmp_path, engine='openpyxl' if resource_format == 'xlsx' else None, nrows=1000)
                    resource_data = df.to_csv(index=False)
                finally:
                    os.unlink(tmp_path)
            except Exception as excel_error:
                raise Exception(f"Failed to read Excel file: {str(excel_error)}")
        else:
            # Fetch as text (CSV, JSON, etc.)
            try:
                resource_data = await fetch_dataset_resource(resource_url)
            except Exception as fetch_error:
                raise Exception(f"Failed to fetch resource data: {str(fetch_error)}")
        
        # Parse structure info first (before analysis)
        structure_info = {}
        try:
            if actual_format == 'csv' or resource_format == 'csv':
                structure_info = parse_csv_sample(resource_data)
            elif actual_format in ['xlsx', 'xls'] or resource_format in ['xlsx', 'xls']:
                structure_info = parse_excel_sample(resource_data)
            elif actual_format == 'json' or resource_format == 'json':
                structure_info = parse_json_sample(resource_data)
        except Exception as parse_error:
            print(f"Warning: Failed to parse structure: {str(parse_error)}")
            # Continue without structure info
        
        # Analyze with Gemini (use actual_format if we extracted from ZIP)
        try:
            analysis = await analyze_dataset_data(dataset, resource_data, actual_format or resource_format, model_name)
        except Exception as analysis_error:
            # If analysis fails, provide a basic summary
            error_msg = str(analysis_error)
            if "Error analyzing dataset" in error_msg:
                analysis = f"""## Overview
This dataset contains data from {dataset.get('title', 'the dataset')}.

## Note
Unable to generate detailed analysis due to: {error_msg}

## Data Structure
The dataset has been fetched but automated analysis could not be completed. Please review the raw data using the resource links below.
"""
            else:
                raise
        
        return {
            "dataset": {
                "id": dataset.get('id'),
                "title": dataset.get('title'),
                "name": dataset.get('name'),
                "notes": dataset.get('notes'),
            },
            "resource": {
                "name": resource.get('name'),
                "format": resource.get('format'),
                "url": resource_url,
            },
            "structure": structure_info,
            "analysis": analysis,
        }
    except Exception as e:
        error_msg = str(e)
        # Provide more context in error message
        if "Dataset not found" in error_msg:
            raise Exception(f"Dataset with ID '{package_id}' not found")
        elif "No resources" in error_msg:
            raise Exception(f"Dataset has no downloadable resources available")
        elif "Resource URL not available" in error_msg:
            raise Exception(f"Resource does not have a valid URL")
        else:
            raise Exception(f"Error getting aggregated view: {error_msg}")

