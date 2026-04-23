import json
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import ResourceNotFoundError
from app.core.config import Config


def _get_client():
    return BlobServiceClient.from_connection_string(Config.AZURE_STORAGE_CONNECTION_STRING)


def _get_container():
    client = _get_client()
    container = client.get_container_client(Config.AZURE_STORAGE_CONTAINER)
    try:
        container.create_container()
    except Exception:
        pass
    return container


def read_named_blob(blob_name: str) -> dict:
    container = _get_container()
    try:
        data = container.get_blob_client(blob_name).download_blob().readall()
        return json.loads(data)
    except ResourceNotFoundError:
        return {}


def write_named_blob(blob_name: str, data: dict) -> None:
    container = _get_container()
    container.get_blob_client(blob_name).upload_blob(
        json.dumps(data, indent=2), overwrite=True
    )


def read_blob():
    result = read_named_blob(Config.AZURE_STORAGE_BLOB_NAME)
    return result if result else {"links": []}


def write_blob(data):
    write_named_blob(Config.AZURE_STORAGE_BLOB_NAME, data)
