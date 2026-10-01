
NYSC Connect — Frontend & Mobile API Specification (v1)

* **Base URL:** `http://localhost:5000/api/v1` 
(Local) / `https://<staging-app>[.onrender.com/api/v1](https://.onrender.com/api/v1)` (Staging)
* **Content-Type:** `application/json`
* **Standard Response Envelope:**
* Success: `{ "status": "success", "message": "...", "data": { ... } }`
* Error: `{ "status": "error", "message": "...", "errors": null }`



---

## 1. Authentication & Users

### `POST /auth/register`

Creates a new corps member account.

* **Access:** Public
* **Request Body:**

```json
{
  "name": "Chinedu Okafor",
  "email": "chinedu@example.com",
  "phone": "+2348012345678",
  "password": "Password123!",
  "state": "Lagos",
  "lga": "Kosofe"
}

```

* **Response (`201 Created`):**

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "66f7f1234a1b2c3d4e5f6789",
      "name": "Chinedu Okafor",
      "email": "chinedu@example.com",
      "phone": "+2348012345678",
      "role": "corps_member",
      "created_at": "2026-09-29T20:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

```

---

### `POST /auth/login`

Authenticates a user and returns a Bearer JWT.

* **Access:** Public
* **Request Body:**

```json
{
  "phonenumber": "+2348012345678",
  "password": "Password123!"
}

```

* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "66f7f1234a1b2c3d4e5f6789",
      "name": "Chinedu Okafor",
      "email": "chinedu@example.com",
      "role": "corps_member"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

```

---

### `GET /auth/me` (or `/users/me`)

Fetches the currently authenticated profile.

* **Access:** Authenticated (`Authorization: Bearer <token>`)
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "_id": "66f7f1234a1b2c3d4e5f6789",
      "name": "Chinedu Okafor",
      "email": "chinedu@example.com",
      "phone": "+2348012345678",
      "role": "corps_member"
    }
  }
}

```

---

## 2. Locations (Pilot Reference Data)

### `GET /locations/states`

Returns supported pilot states.

* **Access:** Public
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "States retrieved successfully",
  "data": {
    "states": ["Lagos", "Oyo"]
  }
}

```

---

### `GET /locations/lgas?state=Lagos`

Returns LGAs available for a given pilot state.

* **Access:** Public
* **Query Parameters:** `state` (required, e.g. `Lagos`, `Oyo`)
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "LGAs retrieved successfully",
  "data": {
    "state": "Lagos",
    "lgas": ["Ikeja", "Kosofe"]
  }
}

```

---

## 3. Accommodations (Housing Module)

### `GET /accommodations`

Searches and filters active listings.

* **Access:** Public
* **Query Parameters (All optional):**
* `state`: Filter by state (`Lagos`, `Oyo`)
* `lga`: Filter by LGA (`Ikeja`, `Kosofe`, `Ibadan North`)
* `minPrice`: Number
* `maxPrice`: Number
* `page`: Number (Default: `1`)
* `limit`: Number (Default: `10`)


* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Accommodations retrieved successfully",
  "data": {
    "total": 4,
    "page": 1,
    "limit": 10,
    "accommodations": [
      {
        "_id": "66f7f9876a1b2c3d4e5f0001",
        "title": "Self-contain lodge near Ikeja Secretariat",
        "description": "Clean self-contain apartment with tiled floor, running borehole water, and prepaid meter.",
        "price": 320000,
        "caution_fee": 30000,
        "address": "14 Allen Avenue, Ikeja, Lagos",
        "state": "Lagos",
        "lga": "Ikeja",
        "ppa_proximity": "Approximately 7 mins bus ride to State Secretariat / NYSC Camp",
        "photos": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
        "property_info": ["borehole_water", "prepaid_meter", "fenced_gate"],
        "contact_phone": "+2348011223344",
        "contact_whatsapp": "+2348011223344",
        "source": "Alumni Referral",
        "status": "active"
      }
    ]
  }
}

```

---

### `GET /accommodations/:id`

Retrieves detailed information for a single lodge.

* **Access:** Public
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Accommodation retrieved successfully",
  "data": {
    "accommodation": {
      "_id": "66f7f9876a1b2c3d4e5f0001",
      "title": "Self-contain lodge near Ikeja Secretariat",
      "description": "Clean self-contain apartment with tiled floor...",
      "price": 320000,
      "caution_fee": 30000,
      "address": "14 Allen Avenue, Ikeja, Lagos",
      "state": "Lagos",
      "lga": "Ikeja",
      "ppa_proximity": "Approximately 7 mins bus ride to State Secretariat",
      "photos": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
      "property_info": ["borehole_water", "prepaid_meter", "fenced_gate"],
      "contact_phone": "+2348011223344",
      "contact_whatsapp": "+2348011223344",
      "source": "Alumni Referral",
      "status": "active"
    }
  }
}

```

---

### `POST /accommodations`

Creates a new accommodation listing. Supports `multipart/form-data` for direct image uploads (up to 3 files under `photos`) or raw JSON.

* **Access:** Authenticated (`Authorization: Bearer <token>`)
* **Request Body (`multipart/form-data` or `json`):**

```json
{
  "title": "Room and parlor mini flat near Oregun",
  "description": "Spacious flat with separate living room, balcony, and steady community transformer.",
  "price": 450000,
  "caution_fee": 50000,
  "address": "8 Kudirat Abiola Way, Oregun, Ikeja, Lagos",
  "state": "Lagos",
  "lga": "Ikeja",
  "ppa_proximity": "Approximately 12 mins transit to Ikeja PPA clusters",
  "contact_phone": "+2348044556677",
  "contact_whatsapp": "+2348044556677",
  "property_info": ["car_park", "borehole_water", "fenced_gate"]
}

```

* **Response (`201 Created`):**

```json
{
  "status": "success",
  "message": "Lodge created successfully",
  "data": { ... }
}

```

---

## 4. Local Information Guide

### `GET /local-info`

Fetches community security and transport tips by location.

* **Access:** Public
* **Query Parameters:** `state`, `lga`, `category` (`transport`, `health`, `security`, `ppa`, `food`, `essential_services`)
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Local info retrieved successfully",
  "data": {
    "guides": [
      {
        "_id": "66f7f3334a1b2c3d4e5f1111",
        "state": "Lagos",
        "lga": "Ikeja",
        "category": "transport",
        "title": "Commuting via Ikeja Bus Terminal",
        "content": "Take official yellow buses (Danfo) or use Cowry Card for BRT from terminal..."
      }
    ]
  }
}

```

---

## 5. Saved Items (Bookmarks)

### `GET /saved`

Lists bookmarked accommodations for the logged-in user.

* **Access:** Authenticated (`Authorization: Bearer <token>`)
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Saved items fetched successfully",
  "data": {
    "saved_items": [
      {
        "_id": "66f7f5554a1b2c3d4e5f2222",
        "accommodation": {
          "_id": "66f7f9876a1b2c3d4e5f0001",
          "title": "Self-contain lodge near Ikeja Secretariat",
          "price": 320000,
          "state": "Lagos",
          "lga": "Ikeja"
        }
      }
    ]
  }
}

```

### `POST /saved`

Saves a lodge to favorites.

* **Access:** Authenticated (`Authorization: Bearer <token>`)
* **Request Body:**

```json
{
  "accommodation_id": "66f7f9876a1b2c3d4e5f0001"
}

```

### `DELETE /saved/:id`

Removes an accommodation from favorites.

* **Access:** Authenticated (`Authorization: Bearer <token>`)
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Item removed from favorites",
  "data": {}
}

```

---

## 6. Safety & Community Moderation

### `POST /reports`

Flags a listing or local guide.

* **Access:** Authenticated (`Authorization: Bearer <token>`)
* **Request Body:**

```json
{
  "target_type": "accommodation",
  "target_id": "66f7f9876a1b2c3d4e5f0001",
  "reason": "scam",
  "details": "The landlord contact asked for inspection money before allowing physical entry."
}

```

*Note: Allowed reasons sent from Frontend can be `outdated`, `incorrect`, `misleading`, `suspicious`, or `scam` (aliased on backend to `suspicious`).*

* **Response (`201 Created`):**

```json
{
  "status": "success",
  "message": "Report submitted successfully",
  "data": {
    "_id": "66f7f8884a1b2c3d4e5f9999",
    "reporter_id": "66f7f1234a1b2c3d4e5f6789",
    "target_type": "accommodation",
    "target_id": "66f7f9876a1b2c3d4e5f0001",
    "reason": "suspicious",
    "details": "The landlord contact asked for inspection money...",
    "status": "pending"
  }
}

```

---

## 7. Admin Queue

### `GET /admin/reports`

Admin-only queue to inspect user reports.

* **Access:** Admin Authenticated (`Authorization: Bearer <token>` where user role is `ADMIN`)
* **Query Parameters:** `status` (`pending`, `reviewed`, `resolved`, `dismissed`, `all`), `page`, `limit`
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Reports retrieved successfully",
  "data": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "reports": [
      {
        "_id": "66f7f8884a1b2c3d4e5f9999",
        "reporter_id": {
          "_id": "66f7f1234a1b2c3d4e5f6789",
          "name": "Chinedu Okafor",
          "phone": "+2348012345678"
        },
        "target_type": "accommodation",
        "target_id": "66f7f9876a1b2c3d4e5f0001",
        "reason": "suspicious",
        "details": "The landlord contact asked for inspection money...",
        "status": "pending",
        "created_at": "2026-09-29T20:45:00.000Z"
      }
    ]
  }
}

```

---

### `PATCH /admin/reports/:id`

Moderator action on a report, with optional direct listing takedown.

* **Access:** Admin Authenticated (`Authorization: Bearer <token>` where user role is `ADMIN`)
* **Request Body:**

```json
{
  "status": "resolved",
  "admin_action": "resolved",
  "admin_notes": "Confirmed scam attempt. Contact blacklisted.",
  "hide_target": true
}

```

* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Report moderated successfully",
  "data": {
    "_id": "66f7f8884a1b2c3d4e5f9999",
    "status": "resolved",
    "admin_action": "resolved",
    "admin_notes": "Confirmed scam attempt. Contact blacklisted."
  }
}

```