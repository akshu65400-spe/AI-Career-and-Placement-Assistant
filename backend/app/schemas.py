from pydantic import BaseModel
from datetime import date
from typing import Optional
class ApplicationCreate(BaseModel):
    company: str
    position: str
    status: str = "Applied"
    applied_date: date


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    applied_date: Optional[date] = None
from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class ProfileCreate(BaseModel):
    phone: Optional[str] = None
    education: Optional[str] = None
    university: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: Optional[str] = None
    experience: Optional[str] = None


class JobCreate(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    description: Optional[str] = None
    required_skills: str
    salary: Optional[str] = None