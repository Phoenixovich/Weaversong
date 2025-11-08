from bson import ObjectId
from typing import Any


def convert_objectids(obj: Any) -> Any:
    """Recursively convert any bson.ObjectId instances in obj to strings.

    Works on dicts, lists, tuples and primitive values. Leaves other types intact.
    """
    # ObjectId -> str
    if isinstance(obj, ObjectId):
        return str(obj)

    # dict -> convert each value
    if isinstance(obj, dict):
        return {k: convert_objectids(v) for k, v in obj.items()}

    # list/tuple -> convert each element
    if isinstance(obj, list):
        return [convert_objectids(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(convert_objectids(v) for v in obj)

    # other -> return as-is
    return obj
