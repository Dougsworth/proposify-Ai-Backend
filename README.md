
# 🚀 **Proposify-AI Backend**

Proposify-AI Backend is a robust and scalable API built with **NestJS** to generate, manage, and refine business proposals using AI 🤖. It features modular architecture, **PDF generation**, **version control**, and **user authentication**. This backend integrates seamlessly with a frontend built using **React** or **Next.js**.

---

## 🌟 **Features**

- 🧠 **AI-Powered Proposal Generation**: Create business proposals dynamically using OpenAI API.
- ✂️ **Section Management**: Reorder, rename, and regenerate proposal sections.
- 🕒 **Version Control**: Maintain a history of changes for each proposal.
- 🔒 **User Authentication**: Secure endpoints with JWT authentication.
- 📝 **PDF Export**: Generate and download proposals as PDFs.
- 🌍 **CORS Support**: Seamless communication with frontend applications.

---

## 🛠️ **Technologies**

- **Framework**: [NestJS](https://nestjs.com/) 🏗️
- **Database**: [Prisma ORM](https://www.prisma.io/) with PostgreSQL 🗄️
- **AI Integration**: [OpenAI API](https://platform.openai.com/) 🤖
- **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/) or Puppeteer 🖨️
- **Authentication**: JWT with Passport.js 🔐
- **Deployment**: Render for backend and PostgreSQL hosting 🌐

---

## 📦 **Installation**

### 1️⃣ Clone the Repository

```bash
git clone [https://github.com/your-repo/proposify-ai-backend.git](https://github.com/Dougsworth/proposify-Ai-Backend/)
cd proposify-ai-backend

2️⃣ Install Dependencies

npm install

3️⃣ Configure Environment Variables

Create a .env file in the project root and add the following:

DATABASE_URL=postgresql://username:password@host:port/database
OPENAI_API_KEY=your-openai-api-key
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
PORT=3000
NODE_ENV=development

🗂️ Database Setup

1️⃣ Migrate the Database

Ensure Prisma is installed and configured properly. Then, deploy the schema:

npx prisma migrate deploy

2️⃣ Seed the Database (Optional)

If a seed script is available, run it to populate initial data:

npx prisma db seed

🏃‍♂️ Running the Application

🔧 Development

npm run start:dev

🚀 Production

npm run build
npm run start:prod

The API will be available at http://localhost:3000/api.

🔗 Endpoints

🔐 Authentication
	•	POST /auth/login: Authenticate and retrieve a JWT token.
	•	POST /auth/register: Create a new user account.

📜 Proposals
	•	POST /api/proposals/create: Create a new proposal.
	•	GET /api/proposals: Fetch all proposals for the logged-in user.
	•	GET /api/proposals/:id: Fetch a single proposal with sections.
	•	PATCH /api/proposals/:id/sections: Update proposal sections.
	•	PATCH /api/proposals/:id/reorder: Reorder proposal sections.
	•	POST /api/proposals/:id/generate-pdf: Generate and download a PDF.

🤖 AI Integration
	•	POST /api/proposals/generate: Generate a new proposal using AI.
	•	POST /api/proposals/:id/sections/:sectionId/regenerate: Regenerate a specific section.

🖨️ PDF Generation

This backend uses pdf-lib for generating PDFs. Alternatively, you can use Puppeteer for HTML-to-PDF conversion if needed.

To customize the PDF format, modify the GeneratePdfService in src/proposal/generate-pdf.service.ts.

🌍 Deployment

1️⃣ Deploy on Render
	•	Create a new Web Service on Render.
	•	Connect your GitHub repository.
	•	Configure the environment variables:
	•	DATABASE_URL
	•	OPENAI_API_KEY
	•	JWT_SECRET
	•	FRONTEND_URL
	•	Set the build and start commands:
	•	Build Command: npm install && npm run build
	•	Start Command: npm run start:prod

2️⃣ Deploy PostgreSQL
	•	Use Render’s PostgreSQL service.
	•	Update the DATABASE_URL in your .env file with the connection string.

📂 Folder Structure

src/
├── auth/                   # Authentication module 🔒
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
├── prisma/                 # Prisma ORM setup 🗄️
│   ├── schema.prisma
│   ├── prisma.service.ts
├── proposal/               # Proposal module 📜
│   ├── proposal.controller.ts
│   ├── proposal.service.ts
│   ├── generate-pdf.service.ts
├── user/                   # User management 👤
│   ├── user.controller.ts
│   ├── user.service.ts
├── app.module.ts           # Root module 🏠
├── main.ts                 # App entry point 🚀

🤝 Contributing
	1.	Fork the repository.
	2.	Create a feature branch:

git checkout -b feature/your-feature-name

	3.	Commit your changes:

git commit -m "Add your message"

	4.	Push to the branch:

git push origin feature/your-feature-name

	5.	Open a pull request.

📜 License

This project is licensed under the MIT License.

📧 Contact

For issues or suggestions, please contact:
	•	Name: Douglas
	•	Email: dougyd30@gmail.com

