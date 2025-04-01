### ERP Integration 
```typescript
// TypeScript interface
interface CreditAccount {
  id: string; // Eclipse ERP customer ID
  companyName: string;
  creditLimit: number;
  availableCredit: number;
  terms: string; // e.g., "Net 30"
  status: CreditAccountStatus;
  lastSyncedAt: Timestamp;
}

type CreditAccountStatus = 'active' | 'on_hold' | 'suspended';

interface ErpInvoice {
  id: string; // Invoice number in Eclipse
  orderId: string; // Reference to order in our system
  customerId: string; // Eclipse customer ID
  invoiceDate: Timestamp;
  dueDate: Timestamp;
  amount: number;
  status: InvoiceStatus;
  syncedAt: Timestamp;
}

type InvoiceStatus = 'pending' | 'issued' | 'paid' | 'overdue' | 'canceled';

// Firestore structure
creditAccounts/{accountId}
  - companyName: string
  - creditLimit: number
  - availableCredit: number
  - terms: string
  - status: string (enum: 'active', 'on_hold', 'suspended')
  - lastSyncedAt: timestamp

erpInvoices/{invoiceId}
  - orderId: string
  - customerId: string
  - invoiceDate: timestamp
  - dueDate: timestamp
  - amount: number
  - status: string (enum: 'pending', 'issued', 'paid', 'overdue', 'canceled')
  - syncedAt: timestamp
```### Guest Users Collection and Types
```typescript
// TypeScript interface
interface GuestUser {
  id: string; // Generated unique ID
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  deliveryAddress: DeliveryAddress;
  paymentMethodId?: string; // Optional Stripe payment method ID
  createdAt: Timestamp;
  lastOrderDate: Timestamp;
}

// Firestore structure
guestUsers/{guestId}
  - email: string
  - firstName: string
  - lastName: string
  - company: string
  - phone: string
  - deliveryAddress: {
      street: string,
      city: string,
      state: string,
      zip: string,
      coordinates: {
        lat: number,
        lng: number
      }
    }
  - paymentMethodId: string (optional)
  - createdAt: timestamp
  - lastOrderDate: timestamp
```### Integration with Main Website

1. **Navigation**
   - Main website includes prominent "Order Asphalt" button linking to the e-commerce portal
   - E-commerce portal maintains consistent branding with main site
   - No shared login between systems (e-commerce portal has authentication, main site does not)

2. **Visual Identity**
   - Shared design tokens and styling
   - Consistent logo, color scheme, and typography
   - Similar UI patterns for familiarity

3. **Analytics Integration**
   - Track user journey from main site to ordering portal
   - Unified conversion tracking
   - Integrated UTM parameter handling# Asphalt Plant E-Commerce Technical Specification

## Project Overview
An e-commerce system for an asphalt production plant that enables customers to order asphalt mixes and secondary products with a payment pre-authorization model. The system allows placing holds on credit cards without charging until after the actual tonnage dispatched is confirmed.

## Tech Stack
- **Frontend**: React.js, Next.js (App Router), Tailwind CSS, TypeScript
- **UI Components**: ShadCN UI
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Payment Processing**: Stripe (with authorization holds)
- **Hosting**: Vercel
- **Repository**: Private GitHub repository

## System Architecture

### Application Components
1. **Public Website** - Marketing, company info, blog (separate system)
2. **E-Commerce Portal** - The focus of this project (subdomain: order.company.com)
3. **Admin Dashboard** - Plant management, order processing
4. **Authentication Service** - Shared between systems

### Integration Points
- SSO between main website and ordering system
- Shared design system for consistent branding
- API Gateway for cross-system communication

## Database Schema and TypeScript Types

### Users Collection and Types
```typescript
// TypeScript interface
interface User {
  uid: string; // Firebase Auth ID
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  role: UserRole;
  defaultDeliveryAddress?: DeliveryAddress;
  paymentMethods: PaymentMethod[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type UserRole = 'customer' | 'staff' | 'admin';

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface PaymentMethod {
  id: string; // Stripe payment method ID
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// Firestore structure
users/{userId}
  - uid: string (Firebase Auth ID)
  - email: string
  - firstName: string
  - lastName: string
  - company: string
  - phone: string
  - role: string (enum: 'customer', 'staff', 'admin')
  - defaultDeliveryAddress: {
      street: string,
      city: string,
      state: string,
      zip: string,
      coordinates: {
        lat: number,
        lng: number
      }
    }
  - paymentMethods: [
      {
        id: string (Stripe payment method ID),
        last4: string,
        brand: string,
        expMonth: number,
        expYear: number,
        isDefault: boolean
      }
    ]
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Products Collection and Types
```typescript
// TypeScript interface
interface Product {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  specs: ProductSpecs;
  pricePerUnit: number;
  unit: ProductUnit;
  minOrderQuantity: number;
  imageUrl: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type ProductType = 'asphalt_mix' | 'secondary';
type ProductUnit = 'ton' | 'each' | 'gallon';

interface ProductSpecs {
  odotApproved: boolean;
  specNumber: string;
  maxAggregateSize?: number; // in mm, only for asphalt mixes
}

// Firestore structure
products/{productId}
  - name: string
  - type: string (enum: 'asphalt_mix', 'secondary')
  - description: string
  - specs: {
      odotApproved: boolean,
      specNumber: string,
      maxAggregateSize: number // in mm
    }
  - pricePerUnit: number
  - unit: string (enum: 'ton', 'each', 'gallon')
  - minOrderQuantity: number
  - imageUrl: string
  - tags: string[]
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Daily Mixes Collection and Types
```typescript
// TypeScript interface
interface DailyMix {
  id: string;
  productId: string; // reference to products collection
  date: Timestamp;
  isProducing: boolean;
  temperature: number;
  estimatedAvailableTime: Timestamp;
  estimatedEndTime: Timestamp;
  currentStatus: MixStatus;
  specialNotes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type MixStatus = 'scheduled' | 'producing' | 'complete' | 'canceled';

// Firestore structure
dailyMixes/{mixId}
  - productId: string (reference to products collection)
  - date: date
  - isProducing: boolean
  - temperature: number
  - estimatedAvailableTime: timestamp
  - estimatedEndTime: timestamp
  - currentStatus: string (enum: 'scheduled', 'producing', 'complete', 'canceled')
  - specialNotes: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

## Orders Collection and Types (Updated)
```typescript
// TypeScript interfaces
interface Order {
  id: string;
  userId?: string; // Reference to users collection (may be null for guest orders)
  guestUserId?: string; // Reference to guestUsers collection (for guest orders)
  customerType: CustomerType;
  items: OrderItem[];
  delivery: DeliveryDetails;
  payment: PaymentDetails | CreditAccountDetails;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type CustomerType = 'guest' | 'registered' | 'credit_account';

interface CreditAccountDetails {
  accountId: string; // Reference to creditAccounts collection
  invoiceId?: string; // Reference to erpInvoices collection once created
  estimatedTotal: number;
  actualTotal?: number; // null until delivery
  status: 'pending' | 'invoiced' | 'paid';
}

// Firestore structure
orders/{orderId}
  - userId: string (reference to users collection, optional)
  - guestUserId: string (reference to guestUsers collection, optional)
  - customerType: string (enum: 'guest', 'registered', 'credit_account')
  - items: [
      {
        productId: string,
        name: string,
        type: string,
        pricePerUnit: number,
        estimatedQuantity: number,
        actualQuantity: number (null until delivery),
        unit: string
      }
    ]
  - delivery: {
      address: {
        street: string,
        city: string,
        state: string,
        zip: string,
        coordinates: {
          lat: number,
          lng: number
        }
      },
      requestedDate: date,
      requestedTimeWindow: string,
      scheduledTime: timestamp,
      specialInstructions: string
    }
  - payment: {
      // For direct payment customers
      paymentMethodId: string,
      paymentIntentId: string,
      estimatedTotal: number,
      authorizedAmount: number,
      actualTotal: number (null until delivery),
      status: string (enum: 'authorized', 'captured', 'refunded', 'failed'),
      capturedAt: timestamp
    } OR {
      // For credit account customers
      accountId: string,
      invoiceId: string (null until invoice created),
      estimatedTotal: number,
      actualTotal: number (null until delivery),
      status: string (enum: 'pending', 'invoiced', 'paid')
    }
  - status: string (enum: 'pending', 'confirmed', 'in_production', 'loaded', 'in_transit', 'delivered', 'completed', 'canceled')
  - statusHistory: [
      {
        status: string,
        timestamp: timestamp,
        note: string,
        userId: string (who made the change)
      }
    ]
  - createdAt: timestamp
  - updatedAt: timestamp
```

## API Endpoints (Updated)

### Authentication (using Firebase Auth)
- `POST /api/auth/login` - Login registered user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/admin-create-user` - Admin-only endpoint to create customer accounts

### Guest Management
- `POST /api/guests` - Create guest user record
- `GET /api/guests/order/{trackingId}` - Get order by tracking ID for guests

### Products
- `GET /api/products` - List all products with filtering
- `GET /api/products/{productId}` - Get product detail
- `GET /api/daily-mixes` - Get today's available mixes

### Orders
- `POST /api/orders/direct-payment` - Create new order with payment pre-authorization
- `POST /api/orders/credit-account` - Create new order on credit account
- `GET /api/orders` - List user's orders
- `GET /api/orders/{orderId}` - Get order detail
- `POST /api/orders/{orderId}/cancel` - Cancel order (if permitted)

### Admin Endpoints
- `PUT /api/admin/daily-mixes/{mixId}` - Update mix status
- `PUT /api/admin/orders/{orderId}/status` - Update order status
- `POST /api/admin/orders/{orderId}/complete-direct-payment` - Complete direct payment order and capture payment
- `POST /api/admin/orders/{orderId}/complete-credit-order` - Complete credit order and queue for invoicing
- `GET /api/admin/credit-accounts` - List credit accounts
- `PUT /api/admin/credit-accounts/{accountId}` - Update credit account details

### Payment Processing
- `POST /api/payments/create-intent` - Create payment intent with authorization hold
- `POST /api/payments/capture/{paymentIntentId}` - Capture authorized payment after delivery
- `POST /api/payments/methods` - Add payment method to user account
- `GET /api/payments/methods` - List user's payment methods

### ERP Integration
- `GET /api/erp/credit-availability/{customerId}` - Check credit availability for customer
- `POST /api/erp/queue-invoice` - Queue order for invoice creation in Eclipse
- `GET /api/erp/invoices/{orderId}` - Get invoice status for order

Note: These endpoints will be typed using proper TypeScript interfaces for request and response types.

## Detailed Business Rules

### Order Flow
1. **Order Creation**
   - Minimum order: 5 tons per asphalt mix type
   - Maximum order for online processing: 200 tons (larger orders require manual approval)
   - Orders must be placed at least 24 hours in advance
   - Weekend delivery requires 48-hour advance notice

2. **Delivery Zones**
   - Primary zone (0-25 miles): Standard delivery fee
   - Secondary zone (26-50 miles): Additional fee per mile
   - Extended zone (51+ miles): Special request required, custom quote

3. **Payment Authorization**
   - Authorization hold: Estimated tonnage + 15% buffer
   - Hold expiration: 7 days (orders must be completed within this window)
   - Minimum authorization amount: $500
   - Failed authorization: 3 retry attempts allowed before order cancellation

4. **Delivery Confirmation**
   - Actual tonnage must be confirmed within 24 hours of delivery
   - Variance threshold: Up to 20% difference between estimated and actual tonnage
   - Larger variances require manager approval before payment capture

5. **Cancellation Policy**
   - Free cancellation: More than 48 hours before scheduled delivery
   - 25% fee: 24-48 hours before scheduled delivery
   - 50% fee: Less than 24 hours before scheduled delivery
   - No cancellation allowed once order status is "in_production"

## User Journeys (Updated)

### Guest Customer Journey
1. User visits the main website and clicks "Order Asphalt" button
2. User browses available mixes and selects desired mix types and quantities
3. User proceeds to checkout and indicates they want to continue as guest
4. User fills out company and contact information
5. User enters delivery details and schedules delivery time
6. User reviews order summary with estimated cost
7. User enters payment method for authorization hold
8. User confirms order and receives confirmation with tracking info
9. User receives email with order tracking link
10. After delivery, user receives notification of actual tonnage and final charge
11. Option to create account is presented for future orders

### Credit Account Customer Journey
1. User signs in to account (created by accounting department)
2. System validates customer's credit standing with ERP
3. User selects from available mixes and creates order
4. User updates quantities and delivery details
5. System checks if order is within available credit limit
6. User confirms order without payment information
7. Order is flagged for accounting to create invoice in Eclipse ERP
8. User tracks order progress through delivery
9. After delivery, tonnage is confirmed and invoice is finalized in ERP

### Plant Staff Journey (Updated)
1. Staff logs in to admin dashboard
2. Staff views today's production schedule and orders
3. Staff distinguishes between credit orders and direct payment orders
4. Staff updates mix availability and production status
5. Staff processes orders and updates status as they progress
6. Staff records actual tonnage after loading trucks
7. For direct payment orders: Staff confirms delivery and enters final tonnage, triggering payment capture
8. For credit orders: Staff confirms delivery and enters final tonnage, triggering invoice creation notification to accounting
9. Staff can view invoicing status from accounting system integration

## Customer Types and Payment Flows

The system must support multiple customer types with equal capability but different payment processes:

1. **Credit Account Customers**
   - Existing customers with established credit terms in Eclipse ERP
   - Accounts created by accounting department, providing username/password to customers
   - Orders placed against available credit limit without requiring credit card
   - System validates available credit from Eclipse ERP before order confirmation
   - No payment collection at time of order
   - Invoiced through Eclipse ERP after delivery
   - Important segment of customer base that requires full support

2. **Direct Payment Customers (One-time or Occasional)**
   - Customers without established credit accounts
   - Must provide credit card for payment pre-authorization
   - Card charged only after actual tonnage is confirmed
   - May be repeat customers but don't have formal accounts in ERP
   - Represents significant portion of online orders

3. **Guest Customers**
   - Variant of direct payment customers who don't create accounts
   - Must provide contact information and delivery details
   - Require credit card for payment pre-authorization
   - Card charged only after actual tonnage is confirmed
   - Provided with order tracking ID without account creation
   - May create account later if they become regular customers

### Dual Payment Flow Support
The system must provide first-class support for both primary payment methods:

**Credit Account Flow:**
1. Customer logs in using credentials provided by accounting department
2. System identifies customer as having a credit account in Eclipse ERP
3. Customer selects products and enters estimated tonnage
4. System validates order against available credit limit
5. Order is placed without credit card requirement
6. Plant produces and delivers asphalt
7. Actual tonnage is recorded by plant personnel
8. System sends invoice creation notification to accounting
9. Accounting creates invoice in Eclipse ERP
10. Customer receives invoice according to their terms

**Direct Payment Flow:**
1. Customer selects products and enters estimated tonnage
2. Customer provides delivery information
3. Customer submits payment card for pre-authorization
4. System places hold on card for estimated amount plus buffer
5. Plant produces and delivers asphalt
6. Actual tonnage is recorded by plant personnel
7. System captures final payment amount based on actual tonnage
8. Customer receives receipt and delivery confirmation

The system must seamlessly support both flows with appropriate interfaces and business logic for each customer type.

## Payment Processing Implementation (Updated)

### Payment Methods

1. **Direct Payment** (Credit Card Authorization)
   - For guest users and registered customers without credit terms
   - Uses Stripe payment authorization and capture flow
   - Pre-authorization for estimated amount plus buffer
   - Capture only after actual tonnage is confirmed

2. **Credit Account** (Invoice-based)
   - For approved customers with established credit terms
   - Validates available credit from Eclipse ERP integration
   - No payment collection at time of order
   - Creates pending invoice notification for accounting team
   - Accounting creates and processes invoice in Eclipse ERP

### Direct Payment Authorization Flow
```javascript
// Example implementation of payment intent creation
const createPaymentIntent = async (req, res) => {
  try {
    const { paymentMethodId, amount, orderId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      capture_method: 'manual', // Key setting for auth only
      confirm: true, // Confirm immediately
      description: `Order #${orderId}`,
      metadata: {
        orderId,
        estimated_amount: amount
      }
    });
    
    // Update order with payment intent ID
    await db.collection('orders').doc(orderId).update({
      'payment.paymentIntentId': paymentIntent.id,
      'payment.status': 'authorized',
      'payment.authorizedAmount': amount
    });
    
    return res.status(200).json({ 
      success: true, 
      paymentIntentId: paymentIntent.id 
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};
```

### Credit Account Validation Flow
```typescript
// Example implementation of credit validation
const validateCreditAndCreateOrder = async (
  req: NextRequest
): Promise<NextResponse<CreateOrderResponse>> => {
  try {
    const { 
      customerId, 
      items,
      deliveryDetails
    } = await req.json() as CreditOrderRequest;
    
    // Get customer credit account
    const creditAccountRef = db.collection('creditAccounts').doc(customerId);
    const creditAccount = await creditAccountRef.get();
    
    if (!creditAccount.exists) {
      return NextResponse.json({
        success: false,
        error: 'Customer credit account not found'
      }, { status: 404 });
    }
    
    // Calculate estimated order total
    const estimatedTotal = calculateOrderTotal(items);
    const accountData = creditAccount.data() as CreditAccount;
    
    // Check if order exceeds available credit
    if (estimatedTotal > accountData.availableCredit) {
      return NextResponse.json({
        success: false,
        error: 'Order exceeds available credit limit'
      }, { status: 400 });
    }
    
    // Create order with credit payment type
    const orderRef = await db.collection('orders').add({
      customerId,
      items,
      deliveryDetails,
      paymentType: 'credit_account',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create pending invoice notification for accounting
    await db.collection('invoiceNotifications').add({
      orderId: orderRef.id,
      customerId,
      estimatedAmount: estimatedTotal,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({
      success: true,
      orderId: orderRef.id
    });
  } catch (error) {
    console.error('Credit order creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
```

## Testing Scenarios

### 1. Payment Authorization Flow Testing
- **Test Case**: Authorize payment for 50 tons of asphalt
- **Expected Result**: Card authorized for estimated amount plus 15% buffer
- **Verification**: Payment intent created with 'requires_capture' status

### 2. Delivery Quantity Variance Testing
- **Test Case**: Order 50 tons, deliver 45 tons
- **Expected Result**: Capture amount is less than authorization
- **Verification**: Payment captured for actual amount, order marked complete

### 3. Failed Authorization Testing
- **Test Case**: Attempt order with invalid/expired card
- **Expected Result**: Order creation fails with appropriate error
- **Verification**: Payment intent returns error, user sees clear message

### 4. Order Cancellation Testing
- **Test Case**: Cancel order 72 hours before delivery
- **Expected Result**: Order cancelled, no charge
- **Verification**: Payment intent cancelled, authorization released

### 5. Multiple Mix Types Testing
- **Test Case**: Order 2 different mix types for same delivery
- **Expected Result**: Single authorization for combined amount
- **Verification**: Order shows both products, correct total authorization

### 6. Scheduled Delivery Testing
- **Test Case**: Schedule delivery for specific date/time
- **Expected Result**: Order confirmed for requested slot
- **Verification**: Production schedule updated, confirmation shows correct time

## Performance Requirements

1. **Response Times**
   - Page load time: < 2 seconds
   - Order submission: < 3 seconds
   - Payment processing: < 5 seconds

2. **Capacity**
   - Support up to 100 concurrent users
   - Handle 500 orders per day
   - Process up to 50 simultaneous payment authorizations

3. **Availability**
   - 99.9% uptime during business hours (5am-8pm)
   - Scheduled maintenance during off-hours only

## Security Requirements

1. **Data Protection**
   - All PII encrypted at rest
   - Payment data never stored (only tokens)
   - TLS 1.3 for all communications

2. **Authentication**
   - Multi-factor authentication for admin users
   - Password requirements: 12+ chars, mixed case, numbers, symbols
   - Session timeout: 30 minutes of inactivity

3. **Authorization**
   - Role-based access control (RBAC)
   - Principle of least privilege for all operations
   - Audit logging for sensitive operations

## Development Standards and Guidelines

### Tech Stack Specifics
* **TypeScript**: Strongly typed throughout the application
* **Next.js**: App Router architecture with React Server Components
* **React**: Functional components with hooks
* **Tailwind CSS**: For styling with utility classes
* **ShadCN UI**: Component foundation
* **Firebase**: Auth, Firestore, and Storage
* **Stripe**: For payment processing

### Code Style and Structure
* Write concise, technical TypeScript code with proper type annotations
* Use functional and declarative programming patterns; avoid classes
* Prefer immutability and pure functions when possible
* Use iteration and modularization over code duplication
* Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
* Structure files: exported component, subcomponents, helpers, static content
* Always use proper TypeScript interfaces or types for data models

### Naming Conventions
* Use kebab-case for directories
* Use camelCase for variables and functions
* Use PascalCase for components and type definitions
* File names for components should be in PascalCase. Rest of the files in kebab-case
* Prefix component names with their type (e.g., ButtonOrder.tsx, CardMixDetails.tsx)
* Use descriptive type names with suffixes like Props, Data, Response

### Syntax and Formatting
* Use the "function" keyword for pure functions
* Use arrow functions for callbacks and component definitions
* Use TypeScript's type inference where appropriate, but add explicit types for function parameters and returns
* Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements
* Use optional chaining (?.) and nullish coalescing (??) operators

### UI and Styling
* Use ShadCN UI components as the foundation
* Extend with Tailwind CSS for custom styling needs
* Implement responsive design with Tailwind CSS; use a mobile-first approach
* Leverage Tailwind's composable classes rather than creating custom CSS
* Use color tokens from the theme consistently

### State Management and Data Flow
* Use Firebase for authentication and data storage
* Implement proper typed Firebase hooks for data fetching and mutations
* Create typed API for Firebase interactions
* Implement proper error handling for all asynchronous operations

### Performance Optimization
* Minimize 'use client', 'useState', and 'useEffect'; favor React Server Components (RSC)
* Wrap client components in Suspense with fallback
* Use dynamic loading for non-critical components
* Optimize images: use Next.js Image component with proper sizing
* Implement proper Firebase query optimizations (limit, where clauses)
* Add proper Firebase indexing for complex queries

### Firebase Conventions
* Create typed hooks for Firestore operations
* Always handle loading and error states
* Implement proper security rules
* Use transactions for operations that require atomicity

### Repository Structure
* Next.js app router structure
* `/app` - Routes and page components
* `/components` - Reusable UI components, organized by domain
  * `/ui` - Base UI components
  * `/forms` - Form components
  * `/layout` - Layout components
  * `/orders` - Order-specific components
  * `/products` - Product-specific components
* `/lib` - Utility functions and shared code
  * `/firebase` - Firebase configuration and utility functions
  * `/stripe` - Stripe integration utilities
  * `/types` - TypeScript type definitions
  * `/utils` - General utility functions
* `/public` - Static assets

### Environment Setup
* Development: Local environment with Firebase emulators
* Staging: Vercel preview deployments
* Production: Vercel production environment

### CI/CD Pipeline
* GitHub Actions for testing
* Vercel for automatic deployment
* Branch protection rules requiring code review

## Mobile and Design Considerations

1. **Responsive Design Requirements**
   - Full functionality on tablet devices (primary field use case)
   - Essential order tracking on smartphones
   - Touch-friendly UI elements (minimum 44x44px touch targets)
   - Mobile-first approach using Tailwind's responsive utilities

2. **Offline Capabilities**
   - Order tracking available offline
   - Form data persistence during connectivity issues
   - Sync when connection is restored

3. **Design Guidelines**
   - Create beautiful, production-worthy designs, not cookie-cutter templates
   - Use ShadCN UI components as building blocks, customize as needed
   - Maintain consistent spacing, typography, and color usage
   - Ensure accessibility standards are met (WCAG 2.1 AA compliance)
   - Do not install additional UI packages unless absolutely necessary
   - Use Tailwind's composable classes rather than creating custom CSS

## Future Enhancements (Phase 2)

1. **Customer Portal Enhancements**
   - Saved order templates
   - Recurring order scheduling
   - Custom mix request form

2. **Delivery Optimization**
   - Real-time GPS tracking of delivery trucks
   - Intelligent scheduling based on plant capacity
   - Route optimization for multiple deliveries

3. **B2B Integration**
   - API for direct ordering from construction management software
   - EDI integration for enterprise customers
   - Bulk ordering with volume discounts

## Type Safety and Component Reusability

1. **Firebase Type Safety**
   ```typescript
   // Example of a typed Firestore hook
   function useOrder(orderId: string): { 
     order: Order | null; 
     isLoading: boolean; 
     error: Error | null 
   } {
     const [order, setOrder] = useState<Order | null>(null);
     const [isLoading, setIsLoading] = useState<boolean>(true);
     const [error, setError] = useState<Error | null>(null);
     
     useEffect(() => {
       if (!orderId) {
         setIsLoading(false);
         return;
       }
       
       const unsubscribe = db
         .collection('orders')
         .doc(orderId)
         .onSnapshot(
           (doc) => {
             if (doc.exists) {
               const data = doc.data() as Omit<Order, 'id'>;
               setOrder({ id: doc.id, ...data });
             } else {
               setOrder(null);
             }
             setIsLoading(false);
           },
           (err) => {
             setError(err);
             setIsLoading(false);
           }
         );
         
       return () => unsubscribe();
     }, [orderId]);
     
     return { order, isLoading, error };
   }
   ```

2. **Component Props Pattern**
   ```typescript
   // Example component with proper TypeScript props pattern
   interface ButtonOrderProps {
     orderId: string;
     orderStatus: OrderStatus;
     onStatusChange: (newStatus: OrderStatus) => Promise<void>;
     isDisabled?: boolean;
   }
   
   const ButtonOrder: React.FC<ButtonOrderProps> = ({
     orderId,
     orderStatus,
     onStatusChange,
     isDisabled = false
   }) => {
     // Component implementation
   };
   ```

3. **Route Handler Type Safety**
   ```typescript
   // Example of typed API route handler
   interface CreateOrderRequest {
     items: {
       productId: string;
       estimatedQuantity: number;
     }[];
     deliveryAddress: DeliveryAddress;
     paymentMethodId: string;
   }
   
   interface CreateOrderResponse {
     success: boolean;
     orderId?: string;
     paymentIntentId?: string;
     error?: string;
   }
   
   export async function POST(
     request: Request
   ): Promise<NextResponse<CreateOrderResponse>> {
     try {
       const body: CreateOrderRequest = await request.json();
       
       // Implementation
       
       return NextResponse.json({ 
         success: true,
         orderId: newOrder.id,
         paymentIntentId: paymentIntent.id
       });
     } catch (error) {
       return NextResponse.json(
         { 
           success: false, 
           error: error instanceof Error ? error.message : 'Unknown error' 
         },
         { status: 400 }
       );
     }
   }
   ```