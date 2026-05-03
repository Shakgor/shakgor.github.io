"""GymBros backend API tests (pytest)."""
import io
import os
import uuid
import pytest
import requests
import openpyxl

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://gymbros-platform.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_ID = "admin"
ADMIN_PW = "gymbros2026"


def _unique_email(prefix="test"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"identifier": ADMIN_ID, "password": ADMIN_PW})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "admin"
    assert "token" in data and isinstance(data["token"], str)
    return data["token"]


@pytest.fixture(scope="session")
def owner_ctx(session):
    email = _unique_email("owner")
    r = session.post(f"{API}/auth/register-owner", json={
        "name": "Test Owner", "email": email, "phone": "+123456", "password": "owner123", "gym_name": "Test Gym"
    })
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"], "gym_id": d["user"]["gym_id"], "email": email, "password": "owner123"}


@pytest.fixture(scope="session")
def activated_gym(session, admin_token, owner_ctx):
    h = {"Authorization": f"Bearer {admin_token}"}
    r = session.post(f"{API}/admin/gyms/{owner_ctx['gym_id']}/subscription",
                     json={"status": "active", "days": 30}, headers=h)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["status"] == "active"
    assert d["expires_at"] is not None
    return owner_ctx


@pytest.fixture(scope="session")
def member_ctx(session, activated_gym):
    email = _unique_email("member")
    r = session.post(f"{API}/auth/register-member", json={
        "name": "Test Member", "email": email, "phone": "+987654",
        "password": "member123", "gym_id": activated_gym["gym_id"]
    })
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"], "email": email, "gym_id": activated_gym["gym_id"]}


# ---- AUTH ----
class TestAuth:
    def test_admin_login(self, admin_token):
        assert admin_token

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"identifier": "admin", "password": "wrong"})
        assert r.status_code == 401

    def test_register_owner_pending(self, session, owner_ctx, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        r = session.get(f"{API}/admin/owners", headers=h)
        assert r.status_code == 200
        gyms = [o["gym"] for o in r.json() if o.get("gym")]
        target = next((g for g in gyms if g["id"] == owner_ctx["gym_id"]), None)
        assert target is not None
        # Should be pending before activation
        assert target["subscription_status"] in ("pending", "active")

    def test_register_member_requires_gym(self, session):
        r = session.post(f"{API}/auth/register-member", json={
            "name": "X", "email": _unique_email("nogym"), "phone": "+1",
            "password": "p", "gym_id": "nonexistent-gym-id"
        })
        assert r.status_code == 404

    def test_change_credentials_admin_only(self, session, member_ctx):
        h = {"Authorization": f"Bearer {member_ctx['token']}"}
        r = session.post(f"{API}/auth/change-credentials", json={"new_password": "x"}, headers=h)
        assert r.status_code == 403


# ---- PUBLIC ----
class TestPublic:
    def test_questions_seeded(self, session):
        r = session.get(f"{API}/public/questions")
        assert r.status_code == 200
        qs = r.json()
        assert len(qs) >= 3

    def test_membership_check_no_payments(self, session, member_ctx):
        r = session.get(f"{API}/public/membership-check", params={"email": member_ctx["email"]})
        assert r.status_code == 200
        d = r.json()
        assert d["membership"]["status"] in ("no_payments", "active", "expired")


# ---- ADMIN ----
class TestAdminQuestions:
    def test_crud_question(self, session, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        payload = {"text": "TEST_q?", "type": "single", "order": 99, "affects": "general",
                   "options": [{"label": "A", "tags": ["x"], "calorie_modifier": 0}]}
        r = session.post(f"{API}/admin/questions", json=payload, headers=h)
        assert r.status_code == 200
        qid = r.json()["id"]
        r = session.put(f"{API}/admin/questions/{qid}", json={**payload, "text": "TEST_q2?"}, headers=h)
        assert r.status_code == 200
        r = session.delete(f"{API}/admin/questions/{qid}", headers=h)
        assert r.status_code == 200


class TestAdminFoods:
    def test_upload_foods_xlsx(self, session, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["name", "calories", "amount", "unit", "tags", "meal_type"])
        ws.append(["Oatmeal", 150, 100, "g", "", "breakfast"])
        ws.append(["Chicken Breast", 250, 150, "g", "meat", "lunch"])
        ws.append(["Rice", 200, 100, "g", "", "lunch"])
        ws.append(["Salad", 80, 100, "g", "vegan,vegetarian", "dinner"])
        ws.append(["Apple", 95, 1, "unit", "vegan,vegetarian", "snack"])
        buf = io.BytesIO(); wb.save(buf); buf.seek(0)
        files = {"file": ("foods.xlsx", buf.getvalue(),
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        r = requests.post(f"{API}/admin/foods/upload", files=files,
                          headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text
        assert r.json()["count"] == 5
        r = session.get(f"{API}/admin/foods", headers=h)
        assert r.status_code == 200
        assert len(r.json()) == 5


class TestAdminRoutines:
    def test_create_routine(self, session, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        payload = {"name": "TEST_Beg", "level": "beginner", "goal_tags": ["weight_loss"],
                   "required_equipment": [], "exercises": [
                       {"name": "Squat", "sets": 3, "reps": "12", "equipment": "", "notes": ""}]}
        r = session.post(f"{API}/admin/routines", json=payload, headers=h)
        assert r.status_code == 200
        r = session.get(f"{API}/admin/routines", headers=h)
        assert r.status_code == 200
        assert any(x["name"] == "TEST_Beg" for x in r.json())


class TestAdminExports:
    def test_export_members(self, session, admin_token):
        r = session.get(f"{API}/admin/export/members",
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert "spreadsheetml" in r.headers.get("Content-Type", "")

    def test_backup_zip(self, session, admin_token):
        r = session.get(f"{API}/admin/backup/zip",
                        headers={"Authorization": f"Bearer {admin_token}"}, timeout=60)
        assert r.status_code == 200
        assert r.headers.get("Content-Type") == "application/zip"
        assert len(r.content) > 100


# ---- OWNER ----
class TestOwner:
    def test_update_branding(self, session, owner_ctx):
        h = {"Authorization": f"Bearer {owner_ctx['token']}"}
        r = session.put(f"{API}/owner/gym/branding",
                        json={"logo_url": "http://x/l.png", "primary_color": "#111111",
                              "secondary_color": "#222222", "background_color": "#000000"}, headers=h)
        assert r.status_code == 200
        r = session.get(f"{API}/owner/gym", headers=h)
        assert r.json()["logo_url"] == "http://x/l.png"

    def test_update_equipment(self, session, owner_ctx):
        h = {"Authorization": f"Bearer {owner_ctx['token']}"}
        r = session.put(f"{API}/owner/gym/equipment",
                        json={"items": ["mancuernas", "barra"]}, headers=h)
        assert r.status_code == 200
        r = session.get(f"{API}/owner/gym", headers=h)
        assert r.json()["equipment"] == ["mancuernas", "barra"]

    def test_register_payment_monthly(self, session, owner_ctx, member_ctx):
        h = {"Authorization": f"Bearer {owner_ctx['token']}"}
        r = session.post(f"{API}/owner/payments",
                         json={"member_id": member_ctx["user"]["id"],
                               "plan_type": "monthly", "amount": 50.0}, headers=h)
        assert r.status_code == 200
        assert r.json()["plan_type"] == "monthly"

        r = session.get(f"{API}/public/membership-check",
                        params={"email": member_ctx["email"]})
        assert r.status_code == 200
        assert r.json()["membership"]["status"] == "active"

    def test_owner_cannot_access_admin(self, session, owner_ctx):
        h = {"Authorization": f"Bearer {owner_ctx['token']}"}
        r = session.get(f"{API}/admin/owners", headers=h)
        assert r.status_code == 403


# ---- MEMBER ----
class TestMember:
    def test_submit_questionnaire_and_pdf(self, session, member_ctx, admin_token):
        # Ensure we have at least one routine + foods (done in prior tests); answer questions
        r = session.get(f"{API}/public/questions")
        qs = r.json()
        answers = [{"question_id": qs[0]["id"], "option_index": 0},
                   {"question_id": qs[1]["id"], "option_index": 0},
                   {"question_id": qs[2]["id"], "option_index": 0}]
        h = {"Authorization": f"Bearer {member_ctx['token']}"}
        r = session.post(f"{API}/member/questionnaire",
                         json={"answers": answers, "base_calories": 2000}, headers=h)
        assert r.status_code == 200, r.text
        plan = r.json()
        assert "calorie_target" in plan
        assert "level" in plan
        assert "diet" in plan
        assert "routine" in plan

        r = session.get(f"{API}/member/plan/pdf", headers=h)
        assert r.status_code == 200
        assert r.headers.get("Content-Type") == "application/pdf"
        assert r.content[:4] == b"%PDF"

    def test_member_cannot_access_admin(self, session, member_ctx):
        h = {"Authorization": f"Bearer {member_ctx['token']}"}
        r = session.get(f"{API}/admin/owners", headers=h)
        assert r.status_code == 403
