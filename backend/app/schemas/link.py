from pydantic import BaseModel, HttpUrl, field_validator

class LinkCreateSchema(BaseModel):
    title: str
    description: str = ""
    href: HttpUrl
    category: str
    isActive: bool = True
    order: int = 0

    @field_validator("title", "category")
    @classmethod
    def not_empty(cls, v):
        if not v.strip():
            raise ValueError("Field must not be blank")
        return v.strip()

class LinkUpdateSchema(BaseModel):
    title: str | None = None
    description: str | None = None
    href: HttpUrl | None = None
    category: str | None = None
    isActive: bool | None = None
    order: int | None = None

class LinkStatusSchema(BaseModel):
    isActive: bool
