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
import asyncio
from datetime import datetime

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


async def analyze_resource_for_visualization(resource_id: str, model_name: str = 'gemini-2.5-flash', max_fields: Optional[int] = None) -> Dict:
    """
    Use Gemini to analyze resource data and recommend visualization fields and limits
    Args:
        resource_id: The resource ID to analyze
        model_name: The Gemini model to use
        max_fields: Maximum number of fields to return (None for no limit, Gemini will select the most relevant)
    """
    try:
        # First, get sample data from the resource
        async with httpx.AsyncClient() as client:
            url = f"{DATA_GOV_BASE_URL}/datastore_search"
            params = {"resource_id": resource_id, "limit": 50}
            response = await client.get(url, params=params, timeout=10.0)
            
            if response.status_code == 404:
                raise Exception(
                    f"Resource '{resource_id}' is not available in the datastore."
                )
            
            response.raise_for_status()
            data = response.json()
            result = data.get("result", {})
            
            fields = result.get("fields", [])
            total = result.get("total", 0)
            sample_records = result.get("records", [])
            
            if not fields or not sample_records:
                raise Exception("No data available for analysis")
        
        # Now analyze with Gemini
        model = genai.GenerativeModel(model_name)
        
        # Prepare sample data for analysis
        sample_data_str = json.dumps(sample_records[:20], ensure_ascii=False, indent=2)
        fields_str = json.dumps([{"id": f["id"], "type": f.get("type", "text")} for f in fields], ensure_ascii=False)
        
        # Format fields list for display
        fields_list = ", ".join([f["id"] for f in fields])
        
        max_fields_instruction = ""
        if max_fields and max_fields > 0:
            max_fields_instruction = f"\nIMPORTANT: Return ONLY the top {max_fields} MOST RELEVANT fields for visualization. Prioritize fields that are most useful for creating meaningful charts and visualizations."
        
        prompt = f"""You are a data visualization expert. Analyze this datastore resource and recommend:

1. **Visualizable Fields**: Which fields should be visualized? Skip:
   - ID fields (_id, id, uuid, etc.)
   - Fields with mostly unique values (like IDs)
   - Fields with only 1-2 distinct values (not informative)
   - Empty or mostly null fields
   {max_fields_instruction}

2. **Recommended Limits**: What's a good limit for querying this data? Consider:
   - Total records: {total}
   - For visualization, we typically need 50-500 records
   - Don't recommend more than 1000 records

3. **Field Types**: For each visualizable field, suggest:
   - Chart type (bar/line/pie) based on data characteristics
   - Whether it's categorical, numeric, temporal, etc.

Return ONLY a valid JSON response with this structure (no markdown, no code blocks):
{{
  "visualizable_fields": ["field1", "field2", ...],
  "recommended_limit": 100,
  "field_recommendations": {{
    "field1": {{
      "chart_type": "bar",
      "data_type": "categorical",
      "reason": "Shows distribution of categories"
    }},
    ...
  }}
}}

Resource Information:
- Total Records: {total}
- Fields ({len(fields)}): {fields_list}

Field Details:
{fields_str}

Sample Records (first 20):
{sample_data_str}

Analysis:"""
        
        response = model.generate_content(prompt)
        analysis_text = response.text.strip()
        
        # Extract JSON from response (might have markdown code blocks)
        if "```json" in analysis_text:
            analysis_text = analysis_text.split("```json")[1].split("```")[0].strip()
        elif "```" in analysis_text:
            analysis_text = analysis_text.split("```")[1].split("```")[0].strip()
        
        # Remove any leading/trailing non-JSON text
        if "{" in analysis_text:
            start = analysis_text.index("{")
            end = analysis_text.rindex("}") + 1
            analysis_text = analysis_text[start:end]
        
        analysis = json.loads(analysis_text)
        
        # Validate the response structure
        if "visualizable_fields" not in analysis:
            raise Exception("Invalid analysis response: missing visualizable_fields")
        if "recommended_limit" not in analysis:
            analysis["recommended_limit"] = min(500, max(100, total))
        if "field_recommendations" not in analysis:
            analysis["field_recommendations"] = {}
        
        # Limit fields if max_fields is specified
        if max_fields and max_fields > 0 and len(analysis["visualizable_fields"]) > max_fields:
            analysis["visualizable_fields"] = analysis["visualizable_fields"][:max_fields]
            # Also limit field_recommendations to match
            analysis["field_recommendations"] = {
                k: v for k, v in analysis["field_recommendations"].items() 
                if k in analysis["visualizable_fields"]
            }
        
        return analysis
    except json.JSONDecodeError as e:
        print(f"Error parsing Gemini JSON response: {str(e)}")
        print(f"Response text: {analysis_text[:500]}")
        raise Exception(f"Failed to parse analysis response: {str(e)}")
    except Exception as e:
        error_msg = str(e)
        if "not available in the datastore" in error_msg or "No data available" in error_msg:
            raise
        # Fallback: return basic recommendations
        print(f"Error analyzing resource with Gemini: {error_msg}")
        # Filter out ID fields manually
        if 'fields' in locals():
            visualizable_fields = [
                f["id"] for f in fields 
                if not f["id"].lower().endswith("_id") 
                and f["id"].lower() not in ["_id", "id", "uuid"]
            ]
        else:
            visualizable_fields = []
        # Limit fields if max_fields is specified
        limited_fields = visualizable_fields[:max_fields] if (max_fields and max_fields > 0) else (visualizable_fields[:6] if visualizable_fields else [])
        return {
            "visualizable_fields": limited_fields,
            "recommended_limit": min(500, max(100, total)) if 'total' in locals() else 100,
            "field_recommendations": {}
        }


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


# Cache file paths - save in backend directory
CACHE_FILE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "datastore_resources_cache.json"))
PREDEFINED_CACHE_FILE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "predefined_resources_cache.json"))


def load_cached_resources() -> List[Dict]:
    """
    Load cached datastore resources from file
    """
    try:
        if os.path.exists(CACHE_FILE_PATH):
            with open(CACHE_FILE_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("resources", [])
    except Exception as e:
        print(f"Error loading cached resources: {str(e)}")
    return []


def save_resources_to_cache(resources: List[Dict], append: bool = False):
    """
    Save discovered datastore resources to cache file for future reference
    If append=True, merges with existing cache (deduplicates by ID)
    """
    try:
        # If appending, load existing resources and merge
        if append:
            existing_resources = load_cached_resources()
            # Create a dict with resource ID as key for deduplication
            resource_dict = {r.get("id"): r for r in existing_resources}
            # Add new resources (will overwrite duplicates)
            for r in resources:
                resource_dict[r.get("id")] = r
            # Convert back to list
            resources = list(resource_dict.values())
        
        cache_data = {
            "last_updated": datetime.now().isoformat(),
            "count": len(resources),
            "resources": resources
        }
        
        # Ensure directory exists
        cache_dir = os.path.dirname(CACHE_FILE_PATH)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
        
        # Write to cache file
        with open(CACHE_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
        
        # Always print when saving (for incremental updates)
        print(f"💾 Saved {len(resources)} resources to cache: {os.path.basename(CACHE_FILE_PATH)}")
    except Exception as e:
        print(f"❌ Error saving resources to cache: {str(e)}")
        import traceback
        traceback.print_exc()


async def get_all_datastore_resources() -> List[Dict]:
    """
    Efficiently discover ALL datastore-enabled resources by checking datastore_active flag
    Processes sequentially to avoid rate limiting
    Saves results to cache for future reference
    """
    datastore_resources = []
    
    try:
        async with httpx.AsyncClient() as client:
            # 1. Get all package IDs
            package_list_url = f"{DATA_GOV_BASE_URL}/package_list"
            package_response = await client.get(package_list_url, timeout=30.0)
            package_response.raise_for_status()
            package_data = package_response.json()
            
            if not package_data.get("success"):
                return []
            
            package_ids = package_data.get("result", [])
            total_packages = len(package_ids)
            
            print(f"Found {total_packages} packages, scanning ALL for datastore resources (sequential processing)...")
            
            # 2. For each package, get details and filter datastore_active resources
            # Process sequentially (no parallel) to avoid rate limiting
            for idx, pkg_id in enumerate(package_ids):
                try:
                    package_show_url = f"{DATA_GOV_BASE_URL}/package_show"
                    params = {"id": pkg_id}
                    pkg_response = await client.get(package_show_url, params=params, timeout=10.0)
                    
                    if pkg_response.status_code != 200:
                        continue
                    
                    pkg_data = pkg_response.json()
                    if not pkg_data.get("success"):
                        continue
                    
                    pkg = pkg_data.get("result", {})
                    resources = pkg.get("resources", [])
                    
                    # Extract year from metadata_created
                    metadata_created = pkg.get("metadata_created", "")
                    year = "unknown"
                    if metadata_created:
                        try:
                            year = metadata_created[:4] if len(metadata_created) >= 4 else "unknown"
                        except Exception:
                            year = "unknown"
                    
                    # Filter resources with datastore_active == true
                    new_resources_in_package = []
                    for res in resources:
                        if res.get("datastore_active"):
                            resource_data = {
                                "id": res.get("id"),
                                "name": f"{pkg.get('title', 'Unknown')} - {res.get('name', 'Resource')}",
                                "description": pkg.get('notes', '')[:200] if pkg.get('notes') else '',
                                "dataset_title": pkg.get('title', 'Unknown'),
                                "dataset_id": pkg.get("id", ""),
                                "resource_name": res.get("name", ""),
                                "format": res.get("format", ""),
                                "year": year,
                                "metadata_created": metadata_created,
                                "organization": pkg.get("organization", {}).get("title", "") if pkg.get("organization") else "",
                            }
                            datastore_resources.append(resource_data)
                            new_resources_in_package.append(resource_data)
                    
                    # Save to cache incrementally whenever we find new resources
                    # Save every 5 resources found or every 25 packages processed
                    if new_resources_in_package:
                        # Save immediately when we find new resources
                        save_resources_to_cache(datastore_resources, append=False)
                        if len(new_resources_in_package) > 0:
                            print(f"  → Found {len(new_resources_in_package)} new resource(s), total: {len(datastore_resources)} (saved to cache)")
                    
                    # Progress indicator every 50 packages
                    if (idx + 1) % 50 == 0:
                        print(f"Processed {idx + 1}/{total_packages} packages, found {len(datastore_resources)} datastore resources...")
                    
                    # Small delay to avoid rate limiting
                    await asyncio.sleep(0.1)  # 100ms delay between requests
                        
                except Exception as e:
                    print(f"Error processing package {pkg_id}: {str(e)}")
                    continue  # Skip if package fetch fails
        
        total_found = len(datastore_resources)
        print(f"Discovery complete: Found {total_found} datastore resources")
        
        # Save to cache for future reference
        if datastore_resources:
            save_resources_to_cache(datastore_resources)
        
        return datastore_resources
    except Exception as e:
        print(f"Error discovering datastore resources: {str(e)}")
        return []


def load_predefined_resources() -> List[Dict]:
    """
    Load the curated predefined resources (top 50 most important)
    """
    try:
        if os.path.exists(PREDEFINED_CACHE_FILE_PATH):
            with open(PREDEFINED_CACHE_FILE_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("resources", [])
    except Exception as e:
        print(f"Error loading predefined resources: {str(e)}")
    return []


def save_predefined_resources(resources: List[Dict]):
    """
    Save the curated predefined resources (top 50 most important)
    """
    try:
        cache_data = {
            "last_updated": datetime.now().isoformat(),
            "count": len(resources),
            "resources": resources
        }
        
        with open(PREDEFINED_CACHE_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Saved {len(resources)} predefined resources to: {os.path.basename(PREDEFINED_CACHE_FILE_PATH)}")
    except Exception as e:
        print(f"❌ Error saving predefined resources: {str(e)}")


def categorize_resource(resource: Dict) -> str:
    """
    Categorize a resource based on its title, description, and organization
    Returns a category name
    """
    title = resource.get("dataset_title", "").lower()
    description = resource.get("description", "").lower()
    org = resource.get("organization", "").lower()
    combined = f"{title} {description} {org}"
    
    # Category keywords mapping
    categories = {
        "Emergency & Safety": ["alert", "emergency", "urgent", "firefighters", "pompieri", "salvare", "112"],
        "Social Services": ["vmi", "venit minim", "social", "ajutor", "beneficiari", "asistenta", "pensie"],
        "Budget & Finance": ["budget", "buget", "financiar", "execution", "plati", "cheltuieli", "venituri"],
        "Health": ["health", "sanatate", "spital", "medical", "medic", "pacient", "tratament"],
        "Education": ["education", "educatie", "scoala", "universitate", "elev", "student", "profesor"],
        "Transport": ["transport", "traffic", "drumuri", "autostrada", "rutier", "circulatie", "mobilitate"],
        "Environment": ["environment", "mediu", "poluare", "calitate aer", "clima", "ecologie", "verde"],
        "Economy & Business": ["economy", "economie", "business", "companii", "firma", "comert", "piata"],
        "Population & Demographics": ["population", "populatie", "demografie", "census", "recensamant", "statistici"],
        "Government & Administration": ["guvern", "minister", "administratie", "institutii", "autoritate", "stat"],
        "Infrastructure": ["infrastructure", "infrastructura", "energie", "electricity", "gaz", "apa", "canalizare"],
        "Justice & Legal": ["justitie", "legal", "judecatorie", "procuratura", "politie", "penal", "civil"],
        "Tourism & Culture": ["tourism", "turism", "culture", "cultura", "patrimoniu", "muzeu", "festival"],
        "Agriculture": ["agriculture", "agricultura", "ferma", "cereale", "animale", "rural", "taran"],
        "Other": []  # Default category
    }
    
    # Check each category
    for category, keywords in categories.items():
        if category == "Other":
            continue
        for keyword in keywords:
            if keyword in combined:
                return category
    
    return "Other"


def get_resources_by_category(category: Optional[str] = None, search_query: Optional[str] = None, limit: int = 100, offset: int = 0) -> Dict:
    """
    Get resources filtered by category and/or search query
    Returns resources with pagination
    """
    all_resources = load_cached_resources()
    
    if not all_resources:
        return {
            "resources": [],
            "total": 0,
            "categories": {},
            "count": 0
        }
    
    # Filter by category
    if category and category != "All":
        filtered_resources = [r for r in all_resources if categorize_resource(r) == category]
    else:
        filtered_resources = all_resources
    
    # Filter by search query
    if search_query:
        search_lower = search_query.lower()
        filtered_resources = [
            r for r in filtered_resources
            if search_lower in r.get("name", "").lower() or
               search_lower in r.get("dataset_title", "").lower() or
               search_lower in r.get("description", "").lower() or
               search_lower in r.get("organization", "").lower()
        ]
    
    # Get category counts
    category_counts = {}
    for resource in all_resources:
        cat = categorize_resource(resource)
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    # Apply pagination
    total = len(filtered_resources)
    paginated_resources = filtered_resources[offset:offset + limit]
    
    return {
        "resources": paginated_resources,
        "total": total,
        "limit": limit,
        "offset": offset,
        "categories": category_counts,
        "count": len(paginated_resources)
    }


async def get_resource_info_by_id(resource_id: str) -> Optional[Dict]:
    """
    Get information about a resource ID from cache
    Returns cached metadata if available
    """
    cached_resources = load_cached_resources()
    for resource in cached_resources:
        if resource.get("id") == resource_id:
            return resource
    return None


async def get_predefined_resource_ids(use_cache: bool = True, force_refresh: bool = False) -> List[Dict]:
    """
    Get all cached resource IDs (for backward compatibility)
    Now returns all resources from cache, use get_resources_by_category for filtering
    """
    try:
        # Load all resources from full cache
        all_resources = load_cached_resources()
        
        if not all_resources:
            print("No resources in full cache. Discovering resources...")
            # If no cache, discover all resources first
            all_resources = await get_all_datastore_resources()
        
        if not all_resources:
            # Fallback: try to get some from recent datasets if the above fails
            try:
                recent_datasets = await fetch_datasets(limit=100)
                for dataset in recent_datasets:
                    resources = dataset.get('resources', [])
                    for resource in resources:
                        if resource.get('datastore_active'):
                            all_resources.append({
                                "id": resource.get('id'),
                                "name": f"{dataset.get('title', 'Unknown')} - {resource.get('name', 'Resource')}",
                                "description": dataset.get('notes', '')[:200] if dataset.get('notes') else '',
                                "dataset_title": dataset.get('title', 'Unknown'),
                                "dataset_id": dataset.get("id", ""),
                                "resource_name": resource.get("name", ""),
                                "format": resource.get("format", ""),
                            })
            except Exception:
                pass
        
        # Sort by name for better organization
        all_resources.sort(key=lambda x: x['name'])
        
        return all_resources
    except Exception as e:
        print(f"Error getting predefined resources: {str(e)}")
        # Last resort: try full cache
        cached_resources = load_cached_resources()
        if cached_resources:
            return cached_resources
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

