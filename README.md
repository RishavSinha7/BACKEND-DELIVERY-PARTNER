1.DATABASE_URL="your_postgres_connection_string"
2.JWT_SECRET="your_jwt_secret"
3.JWT_EXPIRE="7d

### 4. **Prisma Setup**

#### a. **Generate Prisma Client**
```bash
npx prisma generate
```

#### b. **Run Migrations**
```bash
npx prisma migrate dev --name init
```

#### c. **(Optional) Open Prisma Studio**
```bash
npx prisma studio
```

---

## 🏃‍♂️ Running the Backend

### **Development Mode**
```bash
npm run dev
```

### **Production Build**
```bash
npm run build
npm start
```

---

## 🧪 API Test Cases

All endpoints are prefixed with: `http://localhost:3000/api/`

### **1. Users**

#### Create User
- **POST** `/users`
- **Body:**
  ```json
  {
    "email": "alice@example.com",
    "name": "Alice",
    "password": "password123"
  }
  ```
- **Expected:** 201 Created, user object

#### Get All Users
- **GET** `/users`
- **Expected:** 200 OK, array of users

---

### **2. Drivers**

#### Create Driver
- **POST** `/drivers`
- **Body:**
  ```json
  {
    "name": "Bob Driver",
    "licenseNo": "DL123456",
    "vehicleType": "truck",
    "vehicleNumber": "AB12CD3456"
  }
  ```
- **Expected:** 201 Created, driver object

#### Get All Drivers
- **GET** `/drivers`
- **Expected:** 200 OK, array of drivers

---

### **3. Bookings**

#### Create Booking
- **POST** `/bookings`
- **Body:**
  ```json
  {
    "userId": 1,
    "driverId": 1,
    "status": "pending"
  }
  ```
- **Expected:** 201 Created, booking object

#### Get All Bookings
- **GET** `/bookings`
- **Expected:** 200 OK, array of bookings

---

### **4. Coupons**

#### Create Coupon
- **POST** `/coupons`
- **Body:**
  ```json
  {
    "code": "DISCOUNT10",
    "discount": 10,
    "validTill": "2024-12-31T23:59:59.000Z"
  }
  ```
- **Expected:** 201 Created, coupon object

#### Get All Coupons
- **GET** `/coupons`
- **Expected:** 200 OK, array of coupons

---

### **5. Transactions**

#### Create Transaction
- **POST** `/transactions`
- **Body:**
  ```json
  {
    "userId": 1,
    "bookingId": 1,
    "couponId": 1,
    "amount": 100.0
  }
  ```
- **Expected:** 201 Created, transaction object

#### Get All Transactions
- **GET** `/transactions`
- **Expected:** 200 OK, array of transactions

---

## ❌ Negative Test Cases

- **Create user with existing email:** Should return 400/409 error.
- **Create booking with invalid user/driver ID:** Should return 400/404 error.
- **Create coupon with past date:** Should return 400 error.
- **Create user with missing fields:** Should return 400 error.

---

## 🛠️ Useful Prisma CLI Commands

- **Generate client:**  
  `npx prisma generate`
- **Run migrations:**  
  `npx prisma migrate dev --name <migration-name>`
- **Open Prisma Studio:**  
  `npx prisma studio`
- **Format schema:**  
  `npx prisma format`
- **Reset database:**  
  `npx prisma migrate reset`

---

## 📝 Notes

- All endpoints expect and return JSON.
- Use the returned IDs from POST requests for related resources.
- If you add authentication, include JWT tokens in the headers.

---

## 📬 Contact

For questions, open an issue or contact the maintainer.
