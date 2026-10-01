# NYSC Connect — Frontend & Mobile API Specification (v1.1 Verified)

* **Base URL:** `http://localhost:5000/api/v1` (Local) / `https://<staging-app>[.onrender.com/api/v1](https://.onrender.com/api/v1)` (Staging)
* **Default Content-Type:** `application/json` (except image upload which requires `multipart/form-data`)


* **Authorization Header:** `Authorization: Bearer <token>` (Strict: requires exact space after `Bearer`)

---

## Response Envelope & Error Patterns

1. **Standard Module Envelope (Accommodations, Local Info, Saved, Reports, Admin):**
* Success: `{ "status": "success", "message": "...", "data": { ... } }`
* Error: `{ "status": "error", "message": "..." }`
* Unknown Route (404): `{ "status": "fail", "message": "Endpoint ... not found on this server" }`


2. **Auth Envelope (`/auth/register`, `/auth/login`, `/auth/me`, `/users/me`):**
* **No `status` field** and **no outer `data` wrapper**.
* Success register/login: `{ "message": "...", "token": "...", "user": { ... } }`
* Success GET me: `{ "user": { ... } }` (No `message`, no `status`).
* Auth Errors: Direct `{ "message": "..." }` without `status`.



---

## 1. Authentication & User Profile

### `POST /auth/register`

Creates a new corps member account. Self-registration is strictly restricted to corps members.

* **Access:** Public
* **Request Body:**

```json
{
  "name": "Chinedu Okafor",
  "phone": "08012345678",
  "password": "Password123!",
  "state": "Lagos",
  "lga": "Ikeja",
  "ppa": "State High School",
  "ppa_name": "State High School"
}

```

*(Note: `email` is not used. `name`, `phone`, `password`, `state`, and `lga` are required. `ppa` / `ppa_name` is optional.)*

* **Response (`201 Created`):**

```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66f7f1234a1b2c3d4e5f6789",
    "name": "Chinedu Okafor",
    "phone": "08012345678",
    "state": "Lagos",
    "lga": "Ikeja",
    "ppa": "State High School",
    "ppa_name": "State High School",
    "role": "corps_member"
  }
}

```

* **Error (`403 Forbidden` if registering with non–corps member role):**

```json
{
  "message": "Self-registration is limited to corps members at this stage"
}

```

---

### `POST /auth/login`

Authenticates user using phone and password.

* **Access:** Public
* **Request Body:**

```json
{
  "phone": "08012345678",
  "password": "Password123!"
}

```

* **Validation / Error Responses:**
* Missing fields (`400 Bad Request`): `{ "message": "Please provide phone number and password" }`
* Invalid credentials (`401 Unauthorized`): `{ "message": "Invalid credentials" }`


* **Response (`200 OK`):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66f7f1234a1b2c3d4e5f6789",
    "name": "Chinedu Okafor",
    "phone": "08012345678",
    "state": "Lagos",
    "lga": "Ikeja",
    "role": "corps_member"
  }
}

```

---

### `GET /auth/me` (or `GET /users/me`)

Retrieves the profile of the authenticated user.

* **Access:** Authenticated (`Authorization: Bearer <token>`)


* **Response (`200 OK`):**

```json
{
  "user": {
    "id": "66f7f1234a1b2c3d4e5f6789",
    "name": "Chinedu Okafor",
    "phone": "08012345678",
    "state": "Lagos",
    "lga": "Ikeja",
    "ppa": "State High School",
    "ppa_name": "State High School",
    "role": "corps_member"
  }
}

```

---

### `PATCH /users/me`

Updates location and PPA assignment fields.

* **Access:** Authenticated (`Authorization: Bearer <token>`)


* **Request Body:**

```json
{
  "state": "Lagos",
  "lga": "Kosofe",
  "ppa": "Kosofe Local Government Secretariat",
  "ppa_name": "Kosofe Local Government Secretariat"
}

```

* **Response (`200 OK`):**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "66f7f1234a1b2c3d4e5f6789",
    "name": "Chinedu Okafor",
    "phone": "08012345678",
    "state": "Lagos",
    "lga": "Kosofe",
    "ppa": "Kosofe Local Government Secretariat",
    "ppa_name": "Kosofe Local Government Secretariat",
    "role": "corps_member"
  }
}

```

---

## 2. Locations (Pilot Reference Data)

### `GET /locations/states`

* **Access:** Public
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "State retrieved successfully",
  "data": {
    "states": [
      "Lagos",
      "Oyo"
    ]
  }
}

```

---

### `GET /locations/lgas?state=Lagos`

* **Access:** Public
* **Query Parameters:** `state` (required: `Lagos`, `Oyo`)


* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "LGAs retrieved successfully",
  "data": {
    "state": "Lagos",
    "lgas": [
      "Ikeja",
      "Kosofe"
    ]
  }
}

```

*(Querying `state=Oyo` returns `["Ibadan North"]`.)*

---

## 3. Accommodations (Housing Module)

### `GET /accommodations`

Searches and filters active listings.

* **Access:** Public
* **Query Parameters:**
* `state`, `lga`, `minPrice`, `maxPrice`
* `accommodationType`, `amenities`, `sort`
* `page` (default: `1`), `limit` (default: `10`, max: `50`)


* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Accommodations fetched successfully",
  "data": {
    "page": 1,
    "limit": 10,
    "total": 4,
    "totalPages": 1,
    "results": [
      {
        "_id": "66f7f9876a1b2c3d4e5f0001",
        "title": "Self-contain lodge near Ikeja Secretariat",
        "description": "Clean self-contain apartment with borehole water and prepaid meter.",
        "price": 320000,
        "caution_fee": 30000,
        "address": "14 Allen Avenue, Ikeja, Lagos",
        "state": "Lagos",
        "lga": "Ikeja",
        "ppa_proximity": "Approximately 7 mins bus ride to State Secretariat",
        "photos": [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
        ],
        "property_info": [
          "borehole_water",
          "prepaid_meter",
          "fenced_gate"
        ],
        "contact_phone": "08011223344",
        "contact_whatsapp": "08011223344",
        "source": "Alumni Referral",
        "status": "active",
        "verification_status": "verified",
        "last_updated": "2026-09-30T10:00:00.000Z"
      }
    ]
  }
}

```

---

### `GET /accommodations/:id`

Retrieves single listing details.

* **Access:** Authenticated (`Authorization: Bearer <token>`)
* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Accommodation retrieved successfully",
  "data": {
    "_id": "66f7f9876a1b2c3d4e5f0001",
    "title": "Self-contain lodge near Ikeja Secretariat",
    "description": "Clean self-contain apartment with borehole water and prepaid meter.",
    "price": 320000,
    "caution_fee": 30000,
    "address": "14 Allen Avenue, Ikeja, Lagos",
    "state": "Lagos",
    "lga": "Ikeja",
    "ppa_proximity": "Approximately 7 mins bus ride to State Secretariat",
    "photos": [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
    ],
    "property_info": [
      "borehole_water",
      "prepaid_meter"
    ],
    "contact_phone": "08011223344",
    "contact_whatsapp": "08011223344",
    "source": "Alumni Referral",
    "status": "active",
    "last_updated": "2026-09-30T10:00:00.000Z"
  }
}

```

---

### `POST /accommodations`

Creates an accommodation entry using raw JSON. Image uploads must be executed prior using `POST /media/accommodation-images` and passed as strings in `photos`.

* **Access:** Authenticated (`role` must be `admin` or `landlord`)


* **Request Body:**

```json
{
  "title": "Room and parlor mini flat near Oregun",
  "description": "Spacious flat with separate living room, balcony, and steady water.",
  "price": 450000,
  "caution_fee": 50000,
  "address": "8 Kudirat Abiola Way, Oregun, Ikeja, Lagos",
  "state": "Lagos",
  "lga": "Ikeja",
  "ppa_proximity": "Approximately 12 mins transit to Ikeja PPA clusters",
  "contact_phone": "08044556677",
  "contact_whatsapp": "08044556677",
  "property_info": [
    "car_park",
    "borehole_water"
  ],
  "photos": [
    "https://res.cloudinary.com/.../img1.jpg"
  ]
}

```

* **Response (`201 Created`):**

```json
{
  "status": "success",
  "message": "Accommodation created successfully",
  "data": {
    "_id": "66f7f9876a1b2c3d4e5f0002",
    "title": "Room and parlor mini flat near Oregun",
    "price": 450000,
    "status": "active"
  }
}

```

---

### `POST /media/accommodation-images`

Uploads up to 3 listing images to Cloudinary with compression.

* **Access:** Authenticated (`role` must be `admin` or `landlord`)


* **Content-Type:** `multipart/form-data`

* **Body:** Form field `photos` (Array of up to 3 image files)


* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Images uploaded successfully",
  "data": {
    "images": [
      {
        "url": "https://res.cloudinary.com/.../image1.jpg",
        "publicId": "nysc_connect/accommodations/abc123"
      },
      {
        "url": "https://res.cloudinary.com/.../image2.jpg",
        "publicId": "nysc_connect/accommodations/def456"
      }
    ]
  }
}

```

---

## 4. Local Information Guide

### `GET /local-info`

Fetches community safety, transport, and facility guidelines by location.

* **Access:** Authenticated (`Authorization: Bearer <token>`)
* **Query Parameters:**
* `state`, `lga`
* `category` (Allowed: `transport`, `ppa`, `health`, `security`, `food`, `essential_services`)
* `page` (default: `1`), `limit` (default: `20`, max: `50`)


* **Response (`200 OK`):**

```json
{
  "status": "success",
  "total": 1,
  "page": 1,
  "pages": 1,
  "results": 1,
  "data": [
    {
      "_id": "66f7f3334a1b2c3d4e5f1111",
      "state": "Lagos",
      "lga": "Ikeja",
      "category": "transport",
      "title": "Commuting via Ikeja Bus Terminal",
      "description": "Take official yellow buses (Danfo) or use Cowry Card for BRT from terminal..."
    }
  ]
}

```

---

## 5. Saved Items (Bookmarks)

### `GET /saved`

Fetches unpopulated favorited items for the authenticated user.

* **Access:** Authenticated (`Authorization: Bearer <token>`)


* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Saved items retrieved successfully",
  "data": [
    {
      "_id": "66f7f5554a1b2c3d4e5f2222",
      "user_id": "66f7f1234a1b2c3d4e5f6789",
      "item_type": "accommodation",
      "item_id": "66f7f9876a1b2c3d4e5f0001",
      "created_at": "2026-09-30T12:00:00.000Z"
    }
  ]
}

```

---

### `POST /saved`

Saves an accommodation or local info item to favorites.

* **Access:** Authenticated (`Authorization: Bearer <token>`)


* **Request Body:**

```json
{
  "item_type": "accommodation",
  "item_id": "66f7f9876a1b2c3d4e5f0001"
}

```

*(Note: `item_type` accepts `accommodation` or `local_info`.)*

* **Response (`201 Created`):**

```json
{
  "status": "success",
  "message": "Item saved successfully",
  "data": {
    "_id": "66f7f5554a1b2c3d4e5f2222",
    "user_id": "66f7f1234a1b2c3d4e5f6789",
    "item_type": "accommodation",
    "item_id": "66f7f9876a1b2c3d4e5f0001"
  }
}

```

---

### `DELETE /saved/:savedItemId`

Removes a saved record by its record `_id` (not the lodge target ID).

* **Access:** Authenticated (`Authorization: Bearer <token>`)


* **Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "Saved item deleted successfully"
}

```

* **Error (`403 Forbidden` if deleting another user's bookmark):**

```json
{
  "status": "error",
  "message": "You are not allowed to delete this saved item"
}

```

---

## 6. Safety & Community Moderation

### `POST /reports`

Flags an accommodation listing or local guide.

* **Access:** Authenticated (`Authorization: Bearer <token>`)


* **Request Body:**

```json
{
  "target_type": "accommodation",
  "target_id": "66f7f9876a1b2c3d4e5f0001",
  "reason": "scam",
  "details": "The contact asked for an inspection fee before viewing."
}

```

*(Valid `reason` values: `scam`, `outdated`, `incorrect`, `misleading`, `suspicious`. Stored reason matches payload value exactly.)*

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
    "reason": "scam",
    "details": "The contact asked for an inspection fee before viewing.",
    "status": "pending"
  }
}

```

---

## 7. Admin Moderation Queue

### `GET /admin/reports`

Inspects flagged reports queue with populated reporter info.

* **Access:** Admin Authenticated (`role` must be lowercase `"admin"`)
* **Query Parameters:** `status` (default: `pending`; options: `reviewed`, `resolved`, `dismissed`, `all`), `page` (default: `1`), `limit` (default: `20`)


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
          "phone": "08012345678"
        },
        "target_type": "accommodation",
        "target_id": "66f7f9876a1b2c3d4e5f0001",
        "reason": "scam",
        "details": "The contact asked for an inspection fee before viewing.",
        "status": "pending",
        "created_at": "2026-09-29T20:45:00.000Z"
      }
    ]
  }
}

```

---

### `PATCH /admin/reports/:id`

Moderator action on a report. Automatic accommodation status takedown triggers if `reason === "scam"` and status/action is updated to `resolved` or `reviewed`.

* **Access:** Admin Authenticated (`role` must be lowercase `"admin"`)
* **Request Body:**

```json
{
  "status": "resolved",
  "admin_action": "resolved",
  "admin_notes": "Confirmed scam attempt. Contact blacklisted."
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

---

## 8. Common HTTP Error Statuses & Messages

### 401 Unauthorized

Triggered when accessing protected routes without a valid Bearer JWT:

* Missing or malformed header: `{ "status": "error", "message": "Authentication token missing. Please log in." }`
* Invalid or expired token: `{ "status": "error", "message": "Invalid or expired token." }`
* Deleted account: `{ "status": "error", "message": "User account no longer exists." }`

### 403 Forbidden

Triggered when role permissions or resource ownership checks fail:

* Insufficient role permissions (`restrictTo`): `{ "status": "error", "message": "Forbidden. You lack permission for this action." }`
* Unpermitted bookmark deletion: `{ "status": "error", "message": "You are not allowed to delete this saved item" }`
* Non-corps member self-registration: `{ "message": "Self-registration is limited to corps members at this stage" }`