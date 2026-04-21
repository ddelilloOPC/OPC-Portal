import uuid
from datetime import datetime, timezone
from app.services.storage.blob import read_blob, write_blob

def _now():
    return datetime.now(timezone.utc).isoformat()

def get_all_links():
    return read_blob().get("links", [])

def get_active_links():
    return [l for l in get_all_links() if l.get("isActive", False)]

def create_link(payload):
    data = read_blob()
    links = data.setdefault("links", [])
    link = {
        "id": str(uuid.uuid4()),
        "title": payload["title"],
        "description": payload.get("description", ""),
        "href": str(payload["href"]),
        "category": payload["category"],
        "isActive": payload.get("isActive", True),
        "order": payload.get("order", 0),
        "createdAt": _now(),
        "updatedAt": _now(),
    }
    links.append(link)
    write_blob(data)
    return link

def update_link(link_id, payload):
    data = read_blob()
    for link in data.get("links", []):
        if link["id"] == link_id:
            link.update({
                "title": payload.get("title", link["title"]),
                "description": payload.get("description", link["description"]),
                "href": str(payload.get("href", link["href"])),
                "category": payload.get("category", link["category"]),
                "isActive": payload.get("isActive", link["isActive"]),
                "order": payload.get("order", link["order"]),
                "updatedAt": _now(),
            })
            write_blob(data)
            return link
    return None

def patch_link_status(link_id, is_active):
    data = read_blob()
    for link in data.get("links", []):
        if link["id"] == link_id:
            link["isActive"] = is_active
            link["updatedAt"] = _now()
            write_blob(data)
            return link
    return None

def delete_link(link_id):
    data = read_blob()
    links = data.get("links", [])
    new_links = [l for l in links if l["id"] != link_id]
    if len(new_links) == len(links):
        return False
    data["links"] = new_links
    write_blob(data)
    return True
