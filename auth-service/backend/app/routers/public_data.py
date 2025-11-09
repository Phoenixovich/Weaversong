from fastapi import APIRouter, HTTPException, Form, Depends, Query
from app.services.data_gov_service import (
    fetch_datasets,
    get_dataset_details,
    explain_alert,
    explain_social_aid,
    search_ro_alert_datasets,
    search_social_aid_datasets,
    get_dataset_aggregated_view,
    datastore_search,
    datastore_search_sql,
    get_resource_info,
    get_predefined_resource_ids
)
from typing import Optional, Dict
import json
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/public-data", tags=["public-data"])


@router.get("/datasets")
async def list_datasets(
    search: Optional[str] = None,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id)
):
    """
    List or search datasets from data.gov.ro
    """
    try:
        datasets = await fetch_datasets(search_query=search, limit=limit)
        return {"datasets": datasets, "count": len(datasets)}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching datasets: {str(e)}"
        )


@router.get("/datasets/{package_id}")
async def get_dataset(
    package_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get detailed information about a specific dataset
    """
    try:
        dataset = await get_dataset_details(package_id)
        return {"dataset": dataset}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching dataset details: {str(e)}"
        )


@router.get("/datastore/predefined")
async def get_predefined_resources(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(100, ge=1, le=500, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    user_id: str = Depends(get_current_user_id)
):
    """
    Get resources filtered by category and/or search query
    Returns paginated results with category counts
    """
    try:
        from app.services.data_gov_service import get_resources_by_category
        result = get_resources_by_category(category=category, search_query=search, limit=limit, offset=offset)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching resources: {str(e)}"
        )


@router.post("/datastore/aggregate-predefined")
async def aggregate_predefined_resources(
    user_id: str = Depends(get_current_user_id)
):
    """
    Manually trigger aggregation of the top 50 most important resources from the full cache
    """
    try:
        from app.services.data_gov_service import (
            load_cached_resources,
            aggregate_most_important_resources,
            save_predefined_resources
        )
        
        all_resources = load_cached_resources()
        if not all_resources:
            raise HTTPException(
                status_code=404,
                detail="No resources found in cache. Please run discovery first."
            )
        
        # Aggregate the 50 most important resources
        predefined_resources = aggregate_most_important_resources(limit=50)
        
        # Save to predefined cache
        if predefined_resources:
            save_predefined_resources(predefined_resources)
        
        return {
            "message": f"Successfully aggregated {len(predefined_resources)} most important resources",
            "count": len(predefined_resources),
            "resources": predefined_resources
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error aggregating predefined resources: {str(e)}"
        )


@router.get("/datastore/resource-info/{resource_id}")
async def get_resource_info_by_id_endpoint(
    resource_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get cached information about a specific resource ID
    Returns metadata from cache if available
    """
    try:
        from app.services.data_gov_service import get_resource_info_by_id
        resource_info = await get_resource_info_by_id(resource_id)
        if resource_info:
            return resource_info
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Resource ID '{resource_id}' not found in cache"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting resource info: {str(e)}"
        )


@router.get("/datastore/{resource_id}")
async def get_datastore_resource(
    resource_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get information about a datastore resource
    """
    try:
        info = await get_resource_info(resource_id)
        return info
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting resource info: {str(e)}"
        )


@router.post("/datastore/{resource_id}/analyze")
async def analyze_datastore_resource(
    resource_id: str,
    model: Optional[str] = Form('gemini-2.5-flash'),
    user_id: str = Depends(get_current_user_id)
):
    """
    Analyze a datastore resource with Gemini to get visualization recommendations
    """
    try:
        from app.services.data_gov_service import analyze_resource_for_visualization
        analysis = await analyze_resource_for_visualization(resource_id, model_name=model)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing resource: {str(e)}"
        )


@router.post("/datastore/search")
async def search_datastore(
    resource_id: str = Form(...),
    limit: int = Form(100),
    offset: int = Form(0),
    filters: Optional[str] = Form(None),
    q: Optional[str] = Form(None),
    sort: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id)
):
    """
    Search datastore with filters
    """
    try:
        filters_dict = None
        if filters:
            filters_dict = json.loads(filters)
        
        result = await datastore_search(
            resource_id=resource_id,
            limit=limit,
            offset=offset,
            filters=filters_dict,
            q=q,
            sort=sort
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching datastore: {str(e)}"
        )


@router.post("/datastore/sql")
async def search_datastore_sql(
    sql_query: str = Form(...),
    user_id: str = Depends(get_current_user_id)
):
    """
    Search datastore using SQL query
    """
    try:
        result = await datastore_search_sql(sql_query)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing SQL query: {str(e)}"
        )


@router.post("/explain-social-aid")
async def explain_social_aid_endpoint(
    question: str = Form(...),
    context: Optional[str] = Form(None),
    model: Optional[str] = Form('gemini-2.5-flash'),
    user_id: str = Depends(get_current_user_id)
):
    """
    Explain social aid eligibility and benefits
    """
    try:
        explanation = await explain_social_aid(question, context=context, model_name=model)
        return {"explanation": explanation, "question": question}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error explaining social aid: {str(e)}"
        )


@router.get("/alerts/datasets")
async def get_alert_datasets(user_id: str = Depends(get_current_user_id)):
    """
    Get RO-ALERT related datasets
    """
    try:
        datasets = await search_ro_alert_datasets()
        return {"datasets": datasets, "count": len(datasets)}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching alert datasets: {str(e)}"
        )


@router.get("/social-aid/datasets")
async def get_social_aid_datasets(user_id: str = Depends(get_current_user_id)):
    """
    Get social aid related datasets
    """
    try:
        datasets = await search_social_aid_datasets()
        return {"datasets": datasets, "count": len(datasets)}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching social aid datasets: {str(e)}"
        )


@router.get("/datasets/{package_id}/aggregated")
async def get_dataset_aggregated(
    package_id: str,
    resource_index: int = Query(0, ge=0),
    model: Optional[str] = Query('gemini-2.5-flash'),
    user_id: str = Depends(get_current_user_id)
):
    """
    Get an aggregated analysis view of a dataset
    """
    try:
        aggregated_view = await get_dataset_aggregated_view(
            package_id, 
            resource_index=resource_index,
            model_name=model or 'gemini-2.5-flash'
        )
        return aggregated_view
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting aggregated view: {str(e)}"
        )

