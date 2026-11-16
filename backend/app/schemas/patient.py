
from datetime import date, datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class PatientProfileUpdate(BaseModel):
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, value: Optional[date]):
        if value is not None and value >= date.today():
            raise ValueError("Date of birth must be in the past.")
        return value

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: Optional[str]):
        if value is not None:
            value = value.strip().upper()

            allowed_values = {
                "MALE",
                "FEMALE",
                "OTHER",
                "PREFER_NOT_TO_SAY"
            }

            if value not in allowed_values:
                raise ValueError("Invalid gender value.")

        return value

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update.")
        return self


class PatientProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_code: str
    date_of_birth: Optional[date]
    gender: Optional[str]
    created_at: datetime
