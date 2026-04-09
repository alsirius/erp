# Endpoint Management & Integration Guide

This guide explains how data flows from the React frontend to the persistent storage, and how the system supports both **SQLite** and **Snowflake** seamlessly.

## 1. Data Flow Architecture

The system follows a **Tiered Generic Architecture**, ensuring business logic and UI are completely independent of the underlying database engine.

### Path Breakdown
1.  **Frontend**: Uses standard `fetch` with the `authToken` JWT. Note that while the UI uses camelCase, the DAOs handle bridge-mapping to database-specific cases.
2.  **Engine Selection**: The system checks `process.env.DB_ENGINE`. If set to `snowflake`, it swaps the DAO implementation at runtime.
3.  **Service (Agnostic)**: `EndpointService` is database-agnostic. It performs business calculations (like CPM floors) and passes generic objects to the DAO.
4.  **DAO (Engine Specific)**: 
    - **SQLiteDAO**: Maps to lowercase snake_case columns in `siriux.db`.
    - **SnowflakeEndpointDAO**: Maps to **UPPERCASE** columns in Snowflake and handles Snowflake-specific SQL limitations (like the lack of `RETURNING *` support).

---

## 2. Multi-Engine Implementation Details

### Database Toggling (`.env`)
You can switch entire environments by changing a single variable in `backend/.env.development`:

```bash
# To use localized development DB
DB_ENGINE=sqlite

# To use corporate Snowflake staging
DB_ENGINE=snowflake
```

### Identifier Handling
Snowflake identifiers are case-insensitive by default but are stored as **UPPERCASE**. Our `SnowflakeDAO` implementation:
- Automatically transforms all filter and sort keys to uppercase (e.g., `updated_at` $\rightarrow$ `UPDATED_AT`).
- Uses `SnowflakeEndpointDAO.transformData()` to map incoming DTO fields to the exact uppercase columns in the `PENDING_ENDPOINTS` table.

### Debugging & Logging
Every Snowflake query is logged in the backend console with its execution context:
```text
❄️ Snowflake Executed by [OSCAR] using role [ACCOUNTADMIN]
🏠 Context: DB=[SMARTIFY_DB], Schema=[STAGING]
SQL Query: SELECT ... FROM SMARTIFY_DB.STAGING.PENDING_ENDPOINTS ...
```

---

## 3. Snowflake Setup Requirements

To ensure the application can write to Snowflake, the following table structure must exist. Note that Snowflake is strict about column existence.

```sql
CREATE TABLE SMARTIFY_DB.STAGING.PENDING_ENDPOINTS (
    ENDPOINT_ID VARCHAR(255) PRIMARY KEY,
    NAME VARCHAR(255) NOT NULL,
    ADDRESS VARCHAR(500),
    LATITUDE NUMBER(10, 6),
    LONGITUDE NUMBER(10, 6),
    SCREEN_TYPE VARCHAR(20),
    VENUE_TYPE_ID INTEGER,
    VISTAR_VENUE_GROUP_ID VARCHAR(255),
    -- ... and all other spec fields
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

---

> [!IMPORTANT]
> When adding new fields to the system, you must update both the TypeScript `Endpoint` interface AND the `SnowflakeEndpointDAO.transformData()` method to ensure the new field is mapped correctly to the database column.
