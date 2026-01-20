# Spare Request Approval to Defective Item Analysis

## Overview
This document analyzes the requirement: **"When approving a spare request for a ticket issue, automatically add the same spare items which are approved as defecting items"**

## Current Flow Analysis

### 1. Database Schema

#### Key Models

**spareRequest**
```prisma
model spareRequest {
  id         Int      @id @default(autoincrement())
  ticketCode String
  status     String   @default("PENDING")  // "PENDING", "APPROVED", "REJECTED"
  createdBy  Int
  updatedBy  Int?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  createdByUser User               @relation("SpareRequestCreated", fields: [createdBy], references: [id])
  updatedByUser User?              @relation("SpareRequestUpdated", fields: [updatedBy], references: [id])
  spareItems    spareRequestItem[]
}
```

**spareRequestItem**
```prisma
model spareRequestItem {
  id             Int      @id @default(autoincrement())
  spareRequestId Int
  productId      Int
  quantity       Int
  status         String   @default("REQUESTED")  // "REQUESTED", "APPROVED", "REJECTED"
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  spareRequest spareRequest @relation(fields: [spareRequestId], references: [id])
  product      Product      @relation(fields: [productId], references: [id])
}
```

**ProductTransaction** (Inventory Transactions)
```prisma
model ProductTransaction {
  id              Int               @id @default(autoincrement())
  transactionType TransactionType   // RECEIPT, DELIVERY, TICKET_ISSUE, RETURN, TRANSFER, ADJUSTMENT, REPLACEMENT
  status          TransactionStatus @default(PENDING)
  centerCode      String
  ticketId        Int?              // 👈 Link to ticket
  remarks         String?  @db.Text
  createdBy       Int
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  serviceCenter ServiceCenter            @relation(fields: [centerCode], references: [centerCode])
  ticket        Ticket?                  @relation(fields: [ticketId], references: [id])
  items         ProductTransactionItem[] // 👈 Transaction items
  createdByUser User                     @relation("ProductTransactionCreated", fields: [createdBy], references: [id])
}
```

**ProductTransactionItem**
```prisma
model ProductTransactionItem {
  id            Int                @id @default(autoincrement())
  transactionId Int
  productId     Int?
  productName   String?
  condition     InventoryCondition // GOOD, DEFECTIVE, REPAIRABLE, SCRAP
  quantity      Int

  // Relations
  transaction ProductTransaction @relation(fields: [transactionId], references: [id])
  product     Product?           @relation(fields: [productId], references: [id])
}
```

**Inventory** (Stock Management)
```prisma
model Inventory {
  id            Int      @id @default(autoincrement())
  centerCode    String
  productId     Int

  goodQty       Int @default(0)       // 👈 Good condition stock
  repairableQty Int @default(0)
  damagedQty    Int @default(0)       // 👈 Defective/damaged stock
  scrapQty      Int @default(0)

  // Relations
  serviceCenter ServiceCenter @relation(fields: [centerCode], references: [centerCode])
  product       Product       @relation(fields: [productId], references: [id])
}
```

### 2. Server-Side Flow

#### Current Spare Request Approval Logic
**File:** `server/controller/inventoryTransaction.js`

```javascript
exports.approveSpareRequest = async (req, res) => {
  const { spareRequestId, approvedItems } = req.body;
  
  // 1. Get spare request with items
  const spareRequest = await prisma.spareRequest.findUnique({
    where: { id: parseInt(spareRequestId) },
    include: {
      spareItems: {
        include: { product: true }
      }
    }
  });

  // 2. Get related ticket
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode: spareRequest.ticketCode },
    select: {
      id: true,
      ticketCode: true,
      assignedServiceCenter: true
    }
  });

  // 3. Prepare items for transaction (approved items only)
  const items = approvedItems || spareRequest.spareItems;
  const transactionItems = items.map((item) => ({
    productId: item.productId,
    condition: "GOOD",           // ⚠️ Currently only issues GOOD condition
    quantity: item.quantity,
  }));

  // 4. Check inventory availability
  for (const item of transactionItems) {
    const availability = await inventoryTransactionService.checkInventoryAvailability(
      ticket.assignedServiceCenter,
      item.productId,
      item.condition,
      item.quantity
    );
    // ... validation
  }

  // 5. Create TICKET_ISSUE transaction
  const transaction = await inventoryTransactionService.createTransaction({
    transactionType: "TICKET_ISSUE",
    status: "COMPLETED",
    centerCode: ticket.assignedServiceCenter,
    ticketId: ticket.id,
    items: transactionItems,
    remarks: `Spare request #${spareRequestId} approved`
  }, userId);

  // 6. Update spare request status to APPROVED
  await prisma.spareRequest.update({
    where: { id: parseInt(spareRequestId) },
    data: {
      status: "APPROVED",
      updatedBy: userId
    }
  });

  // 7. Update spare request items status to APPROVED
  for (const item of items) {
    await prisma.spareRequestItem.update({
      where: { id: item.id },
      data: { status: "APPROVED" }
    });
  }
};
```

**Inventory Transaction Service:**
`server/service/inventoryTransaction.js`

```javascript
async createTransaction(data, userId) {
  const { transactionType, status, centerCode, items, ...rest } = data;

  return await prisma.$transaction(async (tx) => {
    // Create transaction
    const transaction = await tx.productTransaction.create({
      data: {
        transactionType,
        status: status || "PENDING",
        centerCode,
        createdBy: userId,
        ...rest
      }
    });

    // Create transaction items
    const createdItems = [];
    for (const item of items) {
      const createdItem = await tx.productTransactionItem.create({
        data: {
          transactionId: transaction.id,
          productId: item.productId,
          productName: item.productName,
          condition: item.condition,
          quantity: item.quantity
        },
        include: { product: true }
      });
      createdItems.push(createdItem);
    }

    // Update inventory based on transaction
    await this.updateInventory(transaction, createdItems, tx);

    return { ...transaction, items: createdItems };
  });
}

// For TICKET_ISSUE with status COMPLETED:
// Decrements inventory from GOOD stock (goodQty)
async updateInventory(transaction, items, prismaClient) {
  const { transactionType, status, centerCode } = transaction;

  for (const item of items) {
    const { productId, condition, quantity } = item;
    const conditionField = this.getConditionField(condition);

    switch (transactionType) {
      case "TICKET_ISSUE":
        if (status === "COMPLETED") {
          // Deduct from inventory
          await this.decrementInventory(centerCode, productId, conditionField, quantity, prismaClient);
        }
        break;
      // ... other cases
    }
  }
}
```

### 3. Client-Side Flow

#### API Layer
**File:** `client/src/lib/api/spareApproval.js`

```javascript
// Approve individual spare request item
export const approveSpareRequestItem = async (itemId) => {
  const response = await axios.post(
    `${API_URL}/spare-requests/${itemId}/approve`, 
    {}, 
    { withCredentials: true }
  );
  return response.data;
};

// Get product transaction history
export const getProductTransactionHistory = async (productId, limit = 10) => {
  const response = await axios.get(
    `${API_URL}/inventory/product/${productId}/transactions`,
    {
      params: { limit },
      withCredentials: true,
    }
  );
  return response.data;
};

// Get detailed inventory information
export const getProductInventoryDetails = async (productId) => {
  const response = await axios.get(
    `${API_URL}/inventory/product/${productId}`,
    { withCredentials: true }
  );
  return response.data;
};
```

#### Component 1: Ticket Dashboard
**File:** `client/src/pages/ticket/TicketDashboard.jsx`

**Purpose:** Display and manage spare requests within a specific ticket context

**Key Features:**
1. **Spare Request Display**
   - Shows all spare requests for the current ticket
   - Displays product details, requested quantity, available stock
   - Shows status badges (REQUESTED, APPROVED, REJECTED)
   - Color-coded stock availability indicators

2. **Approval Workflow**
   ```javascript
   const handleSpareApprove = async (itemId) => {
     await approveSpareRequestItem(itemId);
     
     // Refresh data
     await Promise.all([
       fetchSpareRequests(ticketData.ticketCode), 
       fetchTicketById(ticketId)
     ]);
   };
   ```

3. **Transaction History Modal**
   - When clicking "View Details" button
   - Fetches and displays last 5 transactions
   - Shows transaction type and quantity
   - **Currently shows:**
     ```javascript
     {transactionHistory.map((transaction) => (
       <div>
         {transaction.transactionType} - 
         {transaction.items.reduce((acc, item) => acc + item.quantity, 0)} units
         <span>{formatDate(transaction.createdAt)}</span>
       </div>
     ))}
     ```

4. **Inventory Details Display**
   - MACSOFT quantity vs Service Center quantity
   - Current stock levels
   - Can approve status based on availability

**Current Limitations:**
- ❌ Only shows issued parts (TICKET_ISSUE transactions)
- ❌ Does NOT display defective parts returned
- ❌ No visual indication of parts replacement cycle
- ❌ Transaction history doesn't differentiate RETURN vs ISSUE

#### Component 2: Spare Request Approval Page
**File:** `client/src/pages/spareRequestApproval/SpareRequestApproval.jsx`

**Purpose:** Central approval page for all pending spare requests across tickets

**Key Features:**
1. **Bulk Approval Interface**
   - List view of all pending requests
   - Checkbox selection for bulk operations
   - Filter and pagination support

2. **Detailed Modal View**
   ```javascript
   const handleViewSpare = async (item) => {
     const [inventoryResponse, transactionResponse] = await Promise.all([
       getProductInventoryDetails(item.productId),
       getProductTransactionHistory(item.productId, 5)
     ]);
     
     setInventoryDetails(inventoryResponse.data);
     setTransactionHistory(transactionResponse.data);
   };
   ```

3. **Transaction History Display**
   - Shows recent 5 transactions
   - **Current display format:**
     ```jsx
     {transactionHistory.map((transaction) => (
       <div className="flex justify-between">
         <span>
           {transaction.transactionType === 'INBOUND' ? 'Added' : 'Issued'} 
           {transaction.items.reduce((acc, item) => acc + item.quantity, 0)} units
         </span>
         <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
       </div>
     ))}
     ```

4. **Approval Impact Preview**
   - Shows before/after inventory quantities
   - Warning for insufficient stock
   - Confirmation message for stock deduction

**Current Limitations:**
- ❌ Transaction display is generic (INBOUND/ISSUED only)
- ❌ Doesn't show RETURN transactions with DEFECTIVE condition
- ❌ No visual tracking of replacement parts
- ❌ Cannot see the complete part lifecycle (issue + return)

## Problem Identification

### Current Behavior:
1. ✅ Spare request approved
2. ✅ Creates ProductTransaction with type `TICKET_ISSUE`
3. ✅ Deducts items from `goodQty` (GOOD condition)
4. ❌ **Does NOT track defective/removed items that were replaced**

### Missing Functionality:
**When a spare part is issued for a ticket (replacement):**
- The old defective part should be recorded as RETURN
- The defective part should be added to `damagedQty` (DEFECTIVE condition)
- This creates a complete audit trail of what was replaced

## Solution Design

### Option 1: Add RETURN Transaction Automatically (Recommended)

When approving spare requests for ticket issues, create TWO transactions:

1. **TICKET_ISSUE** (New parts issued - already exists)
   - Deducts from `goodQty`
   - ProductTransactionItems with `condition: "GOOD"`

2. **RETURN** (Defective parts returned - NEW)
   - Adds to `damagedQty`
   - ProductTransactionItems with `condition: "DEFECTIVE"`

### Implementation Plan

#### 1. Database Changes: **NO CHANGES REQUIRED** ✅
- All necessary tables and fields already exist
- `ProductTransaction` supports `transactionType: "RETURN"`
- `ProductTransactionItem` supports `condition: "DEFECTIVE"`
- `Inventory` has `damagedQty` field

#### 2. Server-Side Changes

**File:** `server/controller/inventoryTransaction.js`

```javascript
exports.approveSpareRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { spareRequestId, approvedItems } = req.body;

    // ... existing validation code ...

    const items = approvedItems || spareRequest.spareItems;
    
    // Prepare items for TICKET_ISSUE (new parts)
    const issueItems = items.map((item) => ({
      productId: item.productId,
      condition: "GOOD",
      quantity: item.quantity,
    }));

    // Prepare items for RETURN (defective parts)
    const returnItems = items.map((item) => ({
      productId: item.productId,
      condition: "DEFECTIVE",
      quantity: item.quantity,
    }));

    // Check inventory availability for GOOD items
    for (const item of issueItems) {
      const availability = await inventoryTransactionService.checkInventoryAvailability(
        ticket.assignedServiceCenter,
        item.productId,
        item.condition,
        item.quantity
      );

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for product ${item.productId}. Available: ${availability.currentQuantity}, Required: ${availability.requiredQuantity}`,
        });
      }
    }

    // 🆕 Create TICKET_ISSUE transaction (issue new parts)
    const issueTransaction = await inventoryTransactionService.createTransaction({
      transactionType: "TICKET_ISSUE",
      status: "COMPLETED",
      centerCode: ticket.assignedServiceCenter,
      ticketId: ticket.id,
      items: issueItems,
      remarks: `Spare request #${spareRequestId} approved - new parts issued`,
    }, userId);

    // 🆕 Create RETURN transaction (receive defective parts)
    const returnTransaction = await inventoryTransactionService.createTransaction({
      transactionType: "RETURN",
      status: "RECEIVED",
      centerCode: ticket.assignedServiceCenter,
      ticketId: ticket.id,
      items: returnItems,
      remarks: `Spare request #${spareRequestId} approved - defective parts returned`,
    }, userId);

    // Update spare request status
    await prisma.spareRequest.update({
      where: { id: parseInt(spareRequestId) },
      data: {
        status: "APPROVED",
        updatedBy: userId,
      },
    });

    // Update spare request items status
    for (const item of items) {
      await prisma.spareRequestItem.update({
        where: { id: item.id },
        data: { status: "APPROVED" },
      });
    }

    res.json({
      success: true,
      message: "Spare request approved - inventory updated for issued and returned parts",
      transactions: {
        issue: issueTransaction,
        return: returnTransaction
      },
    });
  } catch (error) {
    console.error("❌ Approve spare request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to approve spare request",
    });
  }
};
```

#### 3. Inventory Effects

**Before Approval:**
```
Inventory for Product X at Service Center:
- goodQty: 10
- damagedQty: 2
```

**After Approving 3 units:**
```
Transaction 1 (TICKET_ISSUE):
- Deducts 3 from goodQty

Transaction 2 (RETURN):
- Adds 3 to damagedQty

Result:
- goodQty: 7  (10 - 3)
- damagedQty: 5  (2 + 3)
```

#### 4. Client-Side Changes (Enhanced Transaction Display)

##### A. Update Transaction History Display - Ticket Dashboard

**File:** `client/src/pages/ticket/TicketDashboard.jsx`

**Current Code (Lines ~2270-2285):**
```jsx
{transactionHistory.map((transaction, index) => (
  <div key={index} className="flex items-center justify-between text-xs">
    <span className="text-gray-600">
      {transaction.transactionType} - 
      {transaction.items.length > 0 ? transaction.items.reduce((acc, item) => acc + item.quantity, 0) : 0} units
    </span>
    <span className="text-gray-500">
      {formatDate(transaction.createdAt)}
    </span>
  </div>
))}
```

**Enhanced Code:**
```jsx
{transactionHistory.map((transaction, index) => {
  const totalQty = transaction.items.length > 0 
    ? transaction.items.reduce((acc, item) => acc + item.quantity, 0) 
    : 0;
  
  // Determine transaction icon and color
  const getTransactionStyle = (type) => {
    switch(type) {
      case 'TICKET_ISSUE':
        return { icon: '📤', color: 'text-blue-600', label: 'Issued (New)' };
      case 'RETURN':
        return { icon: '📥', color: 'text-orange-600', label: 'Returned (Defective)' };
      case 'RECEIPT':
        return { icon: '📦', color: 'text-green-600', label: 'Received' };
      default:
        return { icon: '🔄', color: 'text-gray-600', label: type };
    }
  };
  
  const style = getTransactionStyle(transaction.transactionType);
  
  return (
    <div key={index} className="flex items-center justify-between text-xs p-2 hover:bg-gray-50 rounded">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{style.icon}</span>
        <div>
          <span className={`font-medium ${style.color}`}>
            {style.label}
          </span>
          <span className="text-gray-600 ml-1">- {totalQty} units</span>
          {transaction.items.length > 0 && transaction.items[0].condition && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              transaction.items[0].condition === 'GOOD' 
                ? 'bg-green-100 text-green-800'
                : transaction.items[0].condition === 'DEFECTIVE'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {transaction.items[0].condition}
            </span>
          )}
        </div>
      </div>
      <span className="text-gray-500 text-xs">
        {formatDate(transaction.createdAt)}
      </span>
    </div>
  );
})}
```

##### B. Update Transaction History Display - Spare Approval Page

**File:** `client/src/pages/spareRequestApproval/SpareRequestApproval.jsx`

**Current Code (Lines ~930-945):**
```jsx
{transactionHistory.map((transaction, index) => (
  <div key={index} className="flex items-center justify-between p-2 bg-white">
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        transaction.transactionType === 'INBOUND' ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span className="text-sm text-gray-900">
        {transaction.transactionType === 'INBOUND' ? 'Added' : 'Issued'} 
        {transaction.items.length > 0 ? transaction.items.reduce((acc, item) => acc + item.quantity, 0) : 0} units
      </span>
    </div>
    <div className="text-xs text-gray-500">
      {new Date(transaction.createdAt).toLocaleDateString()}
    </div>
  </div>
))}
```

**Enhanced Code:**
```jsx
{transactionHistory.map((transaction, index) => {
  const totalQty = transaction.items.length > 0 
    ? transaction.items.reduce((acc, item) => acc + item.quantity, 0) 
    : 0;
  
  // Get transaction display info
  const getTransactionInfo = (type, items) => {
    const condition = items[0]?.condition;
    
    switch(type) {
      case 'TICKET_ISSUE':
        return {
          dot: 'bg-blue-500',
          label: 'Issued New Parts',
          detail: `${totalQty} unit(s) - ${condition || 'GOOD'}`,
          icon: '→'
        };
      case 'RETURN':
        return {
          dot: 'bg-orange-500',
          label: 'Returned Defective',
          detail: `${totalQty} unit(s) - ${condition || 'DEFECTIVE'}`,
          icon: '←'
        };
      case 'RECEIPT':
        return {
          dot: 'bg-green-500',
          label: 'Received',
          detail: `${totalQty} unit(s)`,
          icon: '↓'
        };
      default:
        return {
          dot: 'bg-gray-500',
          label: type,
          detail: `${totalQty} unit(s)`,
          icon: '•'
        };
    }
  };
  
  const info = getTransactionInfo(transaction.transactionType, transaction.items);
  
  return (
    <div key={index} className="flex items-center justify-between p-3 bg-white rounded hover:bg-gray-50 border border-gray-100">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${info.dot}`}></div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{info.icon}</span>
            <span className="text-sm font-medium text-gray-900">
              {info.label}
            </span>
          </div>
          <span className="text-xs text-gray-500">{info.detail}</span>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
})}
```

##### C. Add Visual Summary Card

Add a new section to show the complete replacement cycle:

```jsx
{/* Replacement Cycle Summary - Add after transaction history */}
{transactionHistory.some(t => t.transactionType === 'TICKET_ISSUE') && (
  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
    <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
      Part Replacement Cycle
    </h5>
    <div className="grid grid-cols-2 gap-4 text-xs">
      <div className="bg-white p-3 rounded">
        <p className="text-gray-600 mb-1">Parts Issued</p>
        <p className="text-2xl font-bold text-blue-600">
          {transactionHistory
            .filter(t => t.transactionType === 'TICKET_ISSUE')
            .reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0)}
        </p>
        <p className="text-gray-500 mt-1">New (GOOD)</p>
      </div>
      <div className="bg-white p-3 rounded">
        <p className="text-gray-600 mb-1">Parts Returned</p>
        <p className="text-2xl font-bold text-orange-600">
          {transactionHistory
            .filter(t => t.transactionType === 'RETURN')
            .reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0)}
        </p>
        <p className="text-gray-500 mt-1">Defective</p>
      </div>
    </div>
  </div>
)}
```

### Option 2: Add Configuration Flag

Add a system setting to enable/disable automatic defective part recording:

**File:** `server/prisma/schema.prisma`

```prisma
model settings {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Add setting:
```sql
INSERT INTO settings (key, value, description) VALUES 
('AUTO_RECORD_DEFECTIVE_PARTS', 'true', 'Automatically record defective parts when approving spare requests');
```

Then check this setting in the approval logic:

```javascript
const autoRecordDefective = await prisma.settings.findUnique({
  where: { key: 'AUTO_RECORD_DEFECTIVE_PARTS' }
});

if (autoRecordDefective?.value === 'true') {
  // Create RETURN transaction for defective parts
}
```

## Testing Scenarios

### Test Case 1: Basic Spare Approval with Defective Return
**Given:**
- Ticket TKT-2026-001 requires 2x MCB replacements
- Service center has 10 GOOD MCBs
- Service center has 1 DEFECTIVE MCB

**When:**
- Spare request approved for 2x MCB

**Then:**
1. TICKET_ISSUE transaction created
   - 2 MCBs issued with condition GOOD
   - goodQty: 10 → 8
2. RETURN transaction created
   - 2 MCBs returned with condition DEFECTIVE
   - damagedQty: 1 → 3
3. Both transactions linked to ticket
4. Spare request status: APPROVED

### Test Case 2: Partial Approval
**Given:**
- Spare request has 3 items: 2x MCB, 1x VFD, 1x Wire

**When:**
- Only 2x MCB approved

**Then:**
1. Only 2x MCB has TICKET_ISSUE + RETURN transactions
2. VFD and Wire remain REQUESTED
3. Spare request status: PARTIALLY_APPROVED

### Test Case 3: Insufficient Inventory
**Given:**
- Spare request for 5x MCB
- Only 3 GOOD MCBs available

**When:**
- Attempt to approve all 5

**Then:**
1. Approval fails with error message
2. No transactions created
3. Inventory unchanged

## Migration Script (if needed)

If you want to backfill existing approved spare requests:

```sql
-- Find all approved spare requests
SELECT sr.id as spare_request_id, 
       sr.ticketCode,
       t.id as ticket_id,
       t.assignedServiceCenter,
       sri.productId,
       sri.quantity
FROM spareRequest sr
JOIN Ticket t ON sr.ticketCode = t.ticketCode
JOIN spareRequestItem sri ON sr.id = sri.spareRequestId
WHERE sr.status = 'APPROVED'
  AND sri.status = 'APPROVED'
  AND NOT EXISTS (
    -- Check if RETURN transaction already exists
    SELECT 1 FROM ProductTransaction pt
    WHERE pt.ticketId = t.id 
      AND pt.transactionType = 'RETURN'
  );
```

## Benefits

1. **Complete Audit Trail**: Track both new parts issued and defective parts returned
2. **Accurate Inventory**: Properly reflect defective inventory levels
3. **Better Reporting**: Understand defect rates and product quality issues
4. **Warranty Management**: Track which parts were replaced and when
5. **Service Analysis**: Analyze which products fail most frequently

## Risks and Considerations

1. **Inventory Overflow**: If defective parts aren't properly disposed, `damagedQty` grows indefinitely
   - **Solution**: Add periodic cleanup/disposal transactions

2. **Validation**: Ensure service centers actually return defective parts
   - **Solution**: Add photo requirements for defective parts (already supported via Attachments)

3. **Condition Mismatch**: What if the replaced part is SCRAP, not just DEFECTIVE?
   - **Solution**: Allow specifying condition in spare request or make configurable

## Recommendations

1. ✅ **Implement Option 1** (Automatic RETURN transaction)
2. ✅ Add configuration setting for future flexibility
3. ✅ Add UI to display both issued and returned parts
4. ✅ Add reporting dashboard for defective parts analysis
5. ✅ Consider adding disposal workflow for accumulated defective parts

## Important Business Rules (Updated)

### ⚠️ Spare Approval Policy
**Approval is ONLY allowed when spare parts are available at the assigned service center**

- ❌ No fallback to MACSOFT hub (MHSEC)
- ✅ Parts must be physically present at the service center assigned to the ticket
- ✅ If stock is insufficient at the assigned center, approval is blocked
- ✅ Error message clearly states: "Insufficient inventory at assigned service center"

This policy ensures:
- Service centers maintain adequate local inventory
- Proper planning and stock management at service center level
- No dependency on central hub for emergency part replacements
- Accurate inventory tracking at service center level

### Implementation Details
When spare request is approved:
1. System checks **only** the assigned service center inventory
2. If sufficient stock exists → Creates TICKET_ISSUE + RETURN transactions
3. If insufficient stock → Approval blocked with clear error message
4. Both transactions always reference the same service center (no cross-center transfers)

## Next Steps

1. Review and approve this design
2. Implement server-side changes
3. Add unit tests for new transaction logic
4. Update client UI to display return transactions
5. Document the new behavior for users
6. Deploy to staging for testing
7. Train users on the new workflow

---

**Document Version:** 1.1  
**Date:** January 3, 2026  
**Author:** AI Analysis  
**Status:** Implemented - Service Center Only Approval  
**Last Updated:** January 3, 2026
