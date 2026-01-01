@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo Creating coffee-admin folder structure...

REM ========================
REM SRC APP STRUCTURE
REM ========================

mkdir src\app\(auth)\login
mkdir src\app\(dashboard)\dashboard
mkdir src\app\(dashboard)\orders\new
mkdir src\app\(dashboard)\orders\[id]
mkdir src\app\(dashboard)\products\new
mkdir src\app\(dashboard)\customers\[id]
mkdir src\app\api\auth\session
mkdir src\app\api\orders\[id]

REM App files
type nul > src\app\(auth)\login\page.tsx
type nul > src\app\(dashboard)\layout.tsx
type nul > src\app\(dashboard)\dashboard\page.tsx
type nul > src\app\(dashboard)\orders\page.tsx
type nul > src\app\(dashboard)\orders\new\page.tsx
type nul > src\app\(dashboard)\orders\[id]\page.tsx
type nul > src\app\(dashboard)\products\page.tsx
type nul > src\app\(dashboard)\products\new\page.tsx
type nul > src\app\(dashboard)\customers\page.tsx
type nul > src\app\(dashboard)\customers\[id]\page.tsx

type nul > src\app\api\auth\session\route.ts
type nul > src\app\api\orders\[id]\route.ts

type nul > src\app\globals.css
type nul > src\app\layout.tsx
type nul > src\app\page.tsx

REM ========================
REM COMPONENTS
REM ========================

mkdir src\components\ui
mkdir src\components\auth
mkdir src\components\orders
mkdir src\components\products
mkdir src\components\layout

type nul > src\components\ui\Button.tsx
type nul > src\components\ui\Input.tsx
type nul > src\components\ui\Select.tsx
type nul > src\components\ui\Badge.tsx
type nul > src\components\ui\Card.tsx

type nul > src\components\auth\LoginForm.tsx

type nul > src\components\orders\OrdersTable.tsx
type nul > src\components\orders\OrderStatusBadge.tsx
type nul > src\components\orders\OrderForm.tsx
type nul > src\components\orders\StatusUpdater.tsx

type nul > src\components\products\ProductSelector.tsx
type nul > src\components\products\ProductForm.tsx

type nul > src\components\layout\Header.tsx
type nul > src\components\layout\Sidebar.tsx
type nul > src\components\layout\DashboardLayout.tsx

REM ========================
REM LIB
REM ========================

mkdir src\lib\firebase
mkdir src\lib\types
mkdir src\lib\utils

type nul > src\lib\firebase\admin.ts
type nul > src\lib\firebase\client.ts
type nul > src\lib\firebase\config.ts

type nul > src\lib\types\index.ts
type nul > src\lib\types\order.ts
type nul > src\lib\types\product.ts
type nul > src\lib\types\customer.ts

type nul > src\lib\utils\auth.ts
type nul > src\lib\utils\formatters.ts
type nul > src\lib\utils\validators.ts

type nul > src\middleware.ts

REM ========================
REM FIREBASE FUNCTIONS
REM ========================

mkdir functions\src\triggers
mkdir functions\src\email\templates
mkdir functions\src\utils

type nul > functions\src\index.ts
type nul > functions\src\triggers\orderStatusChange.ts
type nul > functions\src\email\sender.ts

type nul > functions\src\email\templates\orderConfirmation.ts
type nul > functions\src\email\templates\processing.ts
type nul > functions\src\email\templates\shipped.ts
type nul > functions\src\email\templates\delivered.ts
type nul > functions\src\email\templates\cancelled.ts

type nul > functions\src\utils\logger.ts

type nul > functions\package.json
type nul > functions\tsconfig.json

REM ========================
REM ROOT FILES
REM ========================

type nul > firestore.rules
type nul > firebase.json
type nul > .env.local
type nul > .env.example
type nul > tailwind.config.ts

echo.
echo ✅ coffee-admin structure created successfully!
echo.
pause
