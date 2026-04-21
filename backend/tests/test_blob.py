import json
from unittest.mock import patch, MagicMock

SAMPLE = {"links": [{"id": "abc", "title": "Test", "href": "https://example.com", "category": "Apps", "isActive": True, "order": 0}]}

def _mock(data):
    blob = MagicMock()
    blob.download_blob.return_value.readall.return_value = json.dumps(data).encode()
    container = MagicMock()
    container.get_blob_client.return_value = blob
    svc = MagicMock()
    svc.get_container_client.return_value = container
    return svc, blob

@patch("app.services.storage.blob.BlobServiceClient.from_connection_string")
def test_read_blob(mock_f):
    svc, _ = _mock(SAMPLE)
    mock_f.return_value = svc
    from app.services.storage.blob import read_blob
    assert read_blob()["links"][0]["title"] == "Test"

@patch("app.services.storage.blob.BlobServiceClient.from_connection_string")
def test_write_blob(mock_f):
    svc, blob = _mock({})
    mock_f.return_value = svc
    from app.services.storage.blob import write_blob
    write_blob(SAMPLE)
    blob.upload_blob.assert_called_once()
