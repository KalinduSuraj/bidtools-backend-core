# Inventory Management API Documentation

## Overview

The Inventory Management module provides RESTful APIs for managing construction equipment inventory, including equipment tracking, availability management, and reservation/booking functionality with double-booking prevention.

## Base URL

```
/inventory
```

## Database Schema (DynamoDB)

### Table Structure

| Entity | PK | SK | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|--------|----|----|--------|--------|--------|--------|
| Inventory Item | `INVENTORY` | `ITEM#<inventory_id>` | `CATEGORY#<category>` | `ITEM#<inventory_id>` | `STATUS#<status>` | `ITEM#<inventory_id>` |
| Reservation | `RESERVATION` | `ITEM#<inventory_id>#<reservation_id>` | `INVENTORY#<inventory_id>` | `<start_date>#<end_date>` | - | - |

### Indexes

- **GSI1**: For querying by category (inventory) or by inventory_id (reservations)
- **GSI2**: For querying inventory by status

---

## Inventory Items API

### 1. Get All Inventory Items

**Endpoint:** `GET /inventory`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by category (e.g., EXCAVATOR, CRANE) |
| status | string | No | Filter by status (AVAILABLE, UNAVAILABLE, MAINTENANCE) |
| available | boolean | No | If true, return only available items |

**Response (200 OK):**
```json
[
  {
    "inventory_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Excavator CAT 320",
    "description": "Heavy-duty excavator for large construction projects",
    "category": "EXCAVATOR",
    "model": "CAT-320-2023",
    "serial_number": "EXC-001-2023",
    "total_quantity": 5,
    "available_quantity": 3,
    "reserved_quantity": 2,
    "daily_rate": 25000,
    "hourly_rate": 3500,
    "currency": "LKR",
    "status": "PARTIALLY_AVAILABLE",
    "location": "Colombo Warehouse",
    "supplier_id": "sup-123",
    "condition_rating": 4,
    "min_rental_duration": 4,
    "max_rental_duration": 365,
    "images": ["https://..."],
    "tags": ["heavy", "earthmoving"],
    "created_at": "2025-01-15T08:00:00Z",
    "updated_at": "2025-02-20T10:30:00Z"
  }
]
```

---

### 2. Get Inventory Item by ID

**Endpoint:** `GET /inventory/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Inventory item ID |

**Response (200 OK):**
```json
{
  "inventory_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Excavator CAT 320",
  "description": "Heavy-duty excavator for large construction projects",
  "category": "EXCAVATOR",
  "model": "CAT-320-2023",
  "serial_number": "EXC-001-2023",
  "total_quantity": 5,
  "available_quantity": 3,
  "reserved_quantity": 2,
  "daily_rate": 25000,
  "currency": "LKR",
  "status": "PARTIALLY_AVAILABLE",
  "location": "Colombo Warehouse"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | NOT_FOUND | Inventory item not found |
| 400 | BAD_REQUEST | Invalid UUID format |

---

### 3. Search Inventory Items

**Endpoint:** `GET /inventory/search`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search term (min 2 characters) |

**Response (200 OK):**
```json
[
  {
    "inventory_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Excavator CAT 320",
    "description": "Heavy-duty excavator",
    "category": "EXCAVATOR"
  }
]
```

---

### 4. Get Categories

**Endpoint:** `GET /inventory/categories`

**Response (200 OK):**
```json
{
  "categories": [
    "EXCAVATOR",
    "CRANE",
    "LOADER",
    "BULLDOZER",
    "FORKLIFT",
    "COMPACTOR",
    "GENERATOR",
    "SCAFFOLDING",
    "CONCRETE_MIXER",
    "DUMP_TRUCK",
    "OTHER"
  ]
}
```

---

### 5. Create Inventory Item

**Endpoint:** `POST /inventory`

**Request Body:**
```json
{
  "name": "Excavator CAT 320",
  "description": "Heavy-duty excavator for large construction projects",
  "category": "EXCAVATOR",
  "model": "CAT-320-2023",
  "serial_number": "EXC-001-2023",
  "total_quantity": 5,
  "daily_rate": 25000,
  "hourly_rate": 3500,
  "currency": "LKR",
  "location": "Colombo Warehouse",
  "supplier_id": "sup-123",
  "condition_rating": 5,
  "specifications": {
    "weight": "20 tons",
    "bucket_capacity": "1.2 m³"
  },
  "images": ["https://example.com/excavator.jpg"],
  "tags": ["heavy", "earthmoving"],
  "min_rental_duration": 4,
  "max_rental_duration": 365
}
```

**Required Fields:** `name`, `description`, `category`, `model`, `serial_number`, `total_quantity`, `daily_rate`, `location`

**Response (201 Created):**
```json
{
  "inventory_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Excavator CAT 320",
  "status": "AVAILABLE",
  "available_quantity": 5,
  "reserved_quantity": 0,
  "created_at": "2025-02-21T08:00:00Z"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Validation error (missing/invalid fields) |

---

### 6. Update Inventory Item

**Endpoint:** `PUT /inventory/:id`

**Request Body:**
```json
{
  "name": "Excavator CAT 320 - Updated",
  "total_quantity": 7,
  "daily_rate": 27000,
  "condition_rating": 4,
  "status": "AVAILABLE"
}
```

**Response (200 OK):**
```json
{
  "inventory_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Excavator CAT 320 - Updated",
  "total_quantity": 7,
  "available_quantity": 5,
  "status": "PARTIALLY_AVAILABLE",
  "updated_at": "2025-02-21T10:00:00Z"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | NOT_FOUND | Inventory item not found |
| 400 | BAD_REQUEST | Cannot reduce quantity below reserved amount |

---

### 7. Delete Inventory Item

**Endpoint:** `DELETE /inventory/:id`

**Response:** `204 No Content`

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | NOT_FOUND | Inventory item not found |
| 409 | CONFLICT | Cannot delete item with active reservations |

---

### 8. Set Maintenance Status

**Endpoint:** `PATCH /inventory/:id/maintenance`

**Request Body:**
```json
{
  "maintenance_date": "2025-02-21"
}
```

**Response (200 OK):**
```json
{
  "inventory_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "MAINTENANCE",
  "last_maintenance_date": "2025-02-21"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 409 | CONFLICT | Cannot set to maintenance while units are reserved |

---

## Availability API

### 9. Check Availability

**Endpoint:** `POST /inventory/:id/check-availability`

**Request Body:**
```json
{
  "start_date": "2025-03-01T08:00:00Z",
  "end_date": "2025-03-05T18:00:00Z",
  "quantity": 2
}
```

**Response (200 OK):**
```json
{
  "available": true,
  "available_quantity": 3,
  "requested_quantity": 2,
  "conflicts": []
}
```

**Response (with conflicts):**
```json
{
  "available": false,
  "available_quantity": 1,
  "requested_quantity": 2,
  "conflicts": [
    {
      "reservation_id": "res-123",
      "start_date": "2025-03-01",
      "end_date": "2025-03-03",
      "quantity": 2,
      "status": "CONFIRMED"
    }
  ]
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Start date must be before end date |
| 400 | BAD_REQUEST | Start date cannot be in the past |
| 404 | NOT_FOUND | Inventory item not found |

---

## Reservations API

### 10. Get Reservations for Inventory Item

**Endpoint:** `GET /inventory/:id/reservations`

**Response (200 OK):**
```json
[
  {
    "reservation_id": "res-550e8400",
    "inventory_id": "inv-123",
    "rental_id": "rental-456",
    "user_id": "user-789",
    "quantity": 2,
    "start_date": "2025-03-01T08:00:00Z",
    "end_date": "2025-03-05T18:00:00Z",
    "status": "CONFIRMED",
    "notes": "Deliver to site A",
    "created_at": "2025-02-20T10:00:00Z"
  }
]
```

---

### 11. Create Reservation (Book Equipment)

**Endpoint:** `POST /inventory/:id/reservations`

**Request Body:**
```json
{
  "user_id": "user-789",
  "rental_id": "rental-456",
  "quantity": 2,
  "start_date": "2025-03-01T08:00:00Z",
  "end_date": "2025-03-05T18:00:00Z",
  "notes": "Deliver to construction site A"
}
```

**Required Fields:** `user_id`, `quantity`, `start_date`, `end_date`

**Response (201 Created):**
```json
{
  "reservation_id": "res-550e8400",
  "inventory_id": "inv-123",
  "status": "PENDING",
  "quantity": 2,
  "start_date": "2025-03-01T08:00:00Z",
  "end_date": "2025-03-05T18:00:00Z",
  "created_at": "2025-02-21T08:00:00Z"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Start date must be before end date |
| 400 | BAD_REQUEST | Rental duration below minimum |
| 400 | BAD_REQUEST | Rental duration exceeds maximum |
| 409 | CONFLICT | Not enough units available (double-booking prevention) |
| 404 | NOT_FOUND | Inventory item not found |

---

### 12. Get Reservation by ID

**Endpoint:** `GET /inventory/:id/reservations/:reservationId`

**Response (200 OK):**
```json
{
  "reservation_id": "res-550e8400",
  "inventory_id": "inv-123",
  "user_id": "user-789",
  "quantity": 2,
  "start_date": "2025-03-01T08:00:00Z",
  "end_date": "2025-03-05T18:00:00Z",
  "status": "CONFIRMED"
}
```

---

### 13. Update Reservation

**Endpoint:** `PUT /inventory/:id/reservations/:reservationId`

**Request Body:**
```json
{
  "end_date": "2025-03-07T18:00:00Z",
  "notes": "Extended rental period"
}
```

**Response (200 OK):**
```json
{
  "reservation_id": "res-550e8400",
  "end_date": "2025-03-07T18:00:00Z",
  "updated_at": "2025-02-21T10:00:00Z"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 409 | CONFLICT | Changes conflict with existing reservations |

---

### 14. Confirm Reservation

**Endpoint:** `PATCH /inventory/:id/reservations/:reservationId/confirm`

**Response (200 OK):**
```json
{
  "reservation_id": "res-550e8400",
  "status": "CONFIRMED",
  "updated_at": "2025-02-21T08:30:00Z"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Cannot confirm reservation with current status |

---

### 15. Start Rental

**Endpoint:** `PATCH /inventory/:id/reservations/:reservationId/start`

**Description:** Called when equipment is picked up. Changes reservation status from CONFIRMED to ACTIVE.

**Response (200 OK):**
```json
{
  "reservation_id": "res-550e8400",
  "status": "ACTIVE",
  "updated_at": "2025-03-01T08:00:00Z"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Reservation must be CONFIRMED to start |

---

### 16. End Rental

**Endpoint:** `PATCH /inventory/:id/reservations/:reservationId/end`

**Description:** Called when equipment is returned. Changes reservation status from ACTIVE to COMPLETED and updates inventory availability.

**Response (200 OK):**
```json
{
  "reservation_id": "res-550e8400",
  "status": "COMPLETED",
  "updated_at": "2025-03-05T18:00:00Z"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Reservation must be ACTIVE to end |

---

### 17. Cancel Reservation

**Endpoint:** `PATCH /inventory/:id/reservations/:reservationId/cancel`

**Response (200 OK):**
```json
{
  "reservation_id": "res-550e8400",
  "status": "CANCELLED",
  "updated_at": "2025-02-21T09:00:00Z"
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Cannot cancel COMPLETED or already CANCELLED reservation |

---

## Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "Bad Request"
}
```

## Common Error Codes

| HTTP Status | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid input, validation errors |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Business rule violation (double-booking, etc.) |
| 500 | Internal Server Error | Server error |

---

## Integration Points

### Rental Module Integration

When creating a rental, call:
```
POST /inventory/:id/reservations
{
  "rental_id": "<rental_id>",
  "user_id": "<user_id>",
  "quantity": 1,
  "start_date": "<rental_start>",
  "end_date": "<rental_end>"
}
```

### Supplier Module Integration

Each inventory item can reference a `supplier_id` for tracking equipment sources.

### User Management Integration

Each reservation tracks a `user_id` for audit and notification purposes.

---

## Reservation Status Flow

```
PENDING → CONFIRMED → ACTIVE → COMPLETED
    ↓         ↓          ↓
    └─────────┴──────────┴──→ CANCELLED
```

## Equipment Status Flow

```
AVAILABLE ↔ PARTIALLY_AVAILABLE ↔ UNAVAILABLE
     ↓              ↓                  ↓
     └──────────────┴──────────────────┴──→ MAINTENANCE → AVAILABLE
                                                  ↓
                                              RETIRED
```
