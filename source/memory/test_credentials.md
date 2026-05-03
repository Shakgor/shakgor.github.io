# Test Credentials

## Admin (Global)
- Username: `admin`
- Password: `gymbros2026`
- Role: `admin`
- Login: POST `/api/auth/login` with `{ "identifier": "admin", "password": "gymbros2026" }`

## Test Gym Owner
- Email: `owner@test.com`
- Phone: `+10000000001`
- Password: `owner123`
- Role: `owner`
- Login: POST `/api/auth/login` with `{ "identifier": "owner@test.com", "password": "owner123" }`

## Test Member
- Email: `member@test.com`
- Phone: `+10000000002`
- Password: `member123`
- Role: `member`
- Login: POST `/api/auth/login` with `{ "identifier": "member@test.com", "password": "member123" }`

## Auth Endpoints
- POST `/api/auth/register-owner` — register gym owner
- POST `/api/auth/register-member` — register gym member (requires gym_id)
- POST `/api/auth/login` — login (identifier = username OR email)
- POST `/api/auth/logout`
- GET  `/api/auth/me`
- POST `/api/auth/change-credentials` (admin) — change admin username/password
