import json
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import ResourceNotFoundError
from app.core.config import Config

def _get_client():
    return BlobServiceClient.from_connection_string(Config.AZURE_STORAGE_CONNECTION_STRING)

def read_blob():
    client = _get_client()
    container = client.get_container_client(Config.AZURE_STORAGE_CONTAINER)
    try:
        blob = container.get_blob_client(Config.AZURE_STORAGE_BLOB_NAME)
        data = blob.download_blob().readall()
        return json.loads(data)
    except ResourceNotFoundError:
        return {"links": []}

def write_blob(data):
    client = _get_client()
    container = client.get_container_client(Config.AZURE_STORAGE_CONTAINER)
    try:
        container.create_container()
    except Exception:
        pass
    blob = container.get_blob_client(Config.AZURE_STORAGE_BLOB_NAME)
    blob.upload_blob(json.dumps(data, indent=2), overwrite=True)
