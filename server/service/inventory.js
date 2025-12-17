const { prisma } = require("../lib/clients");

/**
 * Get all inventory records with product details
 * Transforms the schema's goodQty, repairableQty, damagedQty, scrapQty into multiple rows per condition
 */
async function getAllInventory(skip = 0, take = 10, filter = null, centerCode = null, condition = null, category = null) {
  try {
    // Parse pagination parameters
    const skipInt = parseInt(skip) || 0;
    const takeInt = parseInt(take) || 10;

    let where = {};
    if (filter) {
      where.OR = [
        { product: { name: { contains: filter } } },
        { product: { productCode: { contains: filter } } },
        { location: { contains: filter } },
      ];
    }

    // Add centerCode filter if provided
    if (centerCode) {
      where.centerCode = centerCode;
    }

    // Add category filter if provided
    if (category) {
      if (where.product) {
        // If product filter already exists (from general search), merge category filter
        where.product.category = category;
      } else {
        // Create product filter with category
        where.product = {
          category: category
        };
      }
    }

    // First, fetch all matching records to calculate total transformed count
    const allInventoryRecords = await prisma.inventory.findMany({
      where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              category: true,
              brandName: true,
            },
          },
          serviceCenter: {
            select: {
              name: true,
              centerCode: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

    // Transform all records to calculate total count
    const allTransformedInventory = [];
    for (const record of allInventoryRecords) {
      const conditions = [
        { condition: 'GOOD', quantity: record.goodQty },
        { condition: 'REPAIRABLE', quantity: record.repairableQty },
        { condition: 'DEFECTIVE', quantity: record.damagedQty },
        { condition: 'SCRAP', quantity: record.scrapQty },
      ];

      for (const cond of conditions) {
        // Skip if condition filter is provided and doesn't match
        if (condition && cond.condition !== condition) {
          continue;
        }
        
        // Only include conditions that have quantity > 0 or if all are 0, show GOOD
        if (cond.quantity > 0 || (record.goodQty === 0 && record.repairableQty === 0 && record.damagedQty === 0 && record.scrapQty === 0 && cond.condition === 'GOOD')) {
          allTransformedInventory.push({
            id: record.id,
            productId: record.productId,
            centerCode: record.centerCode,
            condition: cond.condition,
            quantity: cond.quantity,
            minStock: record.minStock,
            maxStock: record.maxStock,
            location: record.location,
            updatedAt: record.updatedAt,
            product: record.product,
            serviceCenter: record.serviceCenter,
          });
        }
      }
    }

    // Apply pagination after transformation
    const totalCount = allTransformedInventory.length;
    const startIndex = skipInt * takeInt;
    const endIndex = startIndex + takeInt;
    const paginatedInventory = allTransformedInventory.slice(startIndex, endIndex);
 
    return { inventory: paginatedInventory, count: totalCount };
  } catch (error) {
    throw error;
  }
}

/**
 * Get inventory by product ID
 */
async function getInventoryByProductId(productId, centerCode = null) {
  try {
    const where = { productId: parseInt(productId) };
    if (centerCode) {
      where.centerCode = centerCode;
    }

    const records = await prisma.inventory.findMany({
      where,
      include: {
        product: true,
        serviceCenter: {
          select: {
            name: true,
            centerCode: true,
          },
        },
      },
    });

    // Transform to include condition breakdown
    const result = records.map(record => ({
      ...record,
      conditions: {
        GOOD: record.goodQty,
        REPAIRABLE: record.repairableQty,
        DEFECTIVE: record.damagedQty,
        SCRAP: record.scrapQty,
      },
      totalQuantity: record.goodQty + record.repairableQty + record.damagedQty + record.scrapQty,
    }));

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Create or update inventory for a product
 * Updates the specific condition quantity field
 */
async function upsertInventory(data) {
  try {
    const { productId, centerCode, condition, quantity, minStock, maxStock, location } = data;

    // Map condition to the correct field name
    const conditionFieldMap = {
      'GOOD': 'goodQty',
      'REPAIRABLE': 'repairableQty',
      'DEFECTIVE': 'damagedQty',
      'SCRAP': 'scrapQty',
    };

    const fieldName = conditionFieldMap[condition];
    if (!fieldName) {
      throw new Error(`Invalid condition: ${condition}`);
    }

    // Check if inventory record exists for this product at this center
    const existingInventory = await prisma.inventory.findUnique({
      where: {
        centerCode_productId: {
          centerCode,
          productId: parseInt(productId),
        }
      },
    });

    let inventory;
    if (existingInventory) {
      // Update existing record
      const updateData = {
        [fieldName]: parseInt(quantity),
        updatedAt: new Date(),
      };

      // Only update these if provided
      if (minStock !== undefined) updateData.minStock = parseInt(minStock) || 0;
      if (maxStock !== undefined) updateData.maxStock = maxStock ? parseInt(maxStock) : null;
      if (location !== undefined) updateData.location = location || null;

      inventory = await prisma.inventory.update({
        where: {
          centerCode_productId: {
            centerCode,
            productId: parseInt(productId),
          }
        },
        data: updateData,
        include: {
          product: true,
          serviceCenter: {
            select: {
              name: true,
              centerCode: true,
            },
          },
        },
      });
    } else {
      // Create new record
      const createData = {
        productId: parseInt(productId),
        centerCode,
        goodQty: 0,
        repairableQty: 0,
        damagedQty: 0,
        scrapQty: 0,
        minStock: parseInt(minStock) || 0,
        maxStock: maxStock ? parseInt(maxStock) : null,
        location: location || null,
      };
      createData[fieldName] = parseInt(quantity);

      inventory = await prisma.inventory.create({
        data: createData,
        include: {
          product: true,
          serviceCenter: {
            select: {
              name: true,
              centerCode: true,
            },
          },
        },
      });
    }

    // Return with transformed data
    return {
      ...inventory,
      condition,
      quantity: inventory[fieldName],
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Check stock availability for multiple products
 */
async function checkStockAvailability(items) {
  try {
    const conditionFieldMap = {
      'GOOD': 'goodQty',
      'REPAIRABLE': 'repairableQty',
      'DEFECTIVE': 'damagedQty',
      'SCRAP': 'scrapQty',
    };

    const stockChecks = await Promise.all(
      items.map(async (item, idx) => {
        if (!item.centerCode || !item.productId) {
          throw new Error(`Missing centerCode or productId for item at index ${idx}. Received: centerCode='${item.centerCode}', productId='${item.productId}'`);
        }
        const inventory = await prisma.inventory.findUnique({
          where: {
            centerCode_productId: {
              centerCode: item.centerCode,
              productId: item.productId,
            }
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
              },
            },
          },
        });

        const condition = item.condition || 'GOOD';
        const fieldName = conditionFieldMap[condition];
        const availableQuantity = inventory ? (inventory[fieldName] || 0) : 0;
        const available = availableQuantity >= item.quantity;

        return {
          productId: item.productId,
          centerCode: item.centerCode,
          condition,
          requestedQuantity: item.quantity,
          availableQuantity,
          sufficient: available,
          product: inventory?.product || null,
          inventoryExists: !!inventory,
        };
      })
    );

    const allAvailable = stockChecks.every((check) => check.sufficient);
    const insufficientItems = stockChecks.filter((check) => !check.sufficient);

    return {
      allAvailable,
      stockChecks,
      insufficientItems,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Deduct inventory quantities (used when spare items are issued)
 */
async function deductInventory(items, ticketCode = null, updatedBy = null) {
  try {
    const conditionFieldMap = {
      'GOOD': 'goodQty',
      'REPAIRABLE': 'repairableQty',
      'DEFECTIVE': 'damagedQty',
      'SCRAP': 'scrapQty',
    };

    const results = [];

    for (const item of items) {
      const condition = item.condition || 'GOOD';
      const fieldName = conditionFieldMap[condition];

      const currentInventory = await prisma.inventory.findUnique({
        where: {
          centerCode_productId: {
            centerCode: item.centerCode,
            productId: item.productId,
          }
        },
        include: {
          product: true,
          serviceCenter: true
        },
      });

      if (!currentInventory) {
        throw new Error(
          `No inventory record found for product ID ${item.productId} at center ${item.centerCode}`
        );
      }

      const currentQty = currentInventory[fieldName] || 0;
      if (currentQty < item.quantity) {
        throw new Error(
          `Insufficient ${condition} stock for ${currentInventory.product.name}. Available: ${currentQty}, Required: ${item.quantity}`
        );
      }

      // Update inventory quantity
      const updatedInventory = await prisma.inventory.update({
        where: {
          centerCode_productId: {
            centerCode: item.centerCode,
            productId: item.productId,
          }
        },
        data: {
          [fieldName]: currentQty - item.quantity,
          updatedAt: new Date(),
        },
        include: { product: true },
      });

      // Create transaction record
      const ticketId = ticketCode ? await getTicketIdFromCode(ticketCode) : null;
      await prisma.productTransaction.create({
        data: {
          transactionType: "DELIVERY",
          centerCode: item.centerCode,
          ticketId,
          remarks: ticketCode
            ? `Spare parts issued for ticket ${ticketCode} (${condition})`
            : `Inventory deduction (${condition})`,
          createdBy: updatedBy || 1,
          items: {
            create: {
              productId: item.productId,
              condition,
              quantity: item.quantity,
            }
          }
        },
      });

      results.push({
        productId: item.productId,
        centerCode: item.centerCode,
        condition,
        product: updatedInventory.product,
        previousQuantity: currentQty,
        newQuantity: updatedInventory[fieldName],
        deductedQuantity: item.quantity,
      });
    }

    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Add inventory quantities (used for inbound activities/stock replenishment)
 */
async function addInventory(items, notes = null, updatedBy = null) {
  try {
    const conditionFieldMap = {
      'GOOD': 'goodQty',
      'REPAIRABLE': 'repairableQty',
      'DEFECTIVE': 'damagedQty',
      'SCRAP': 'scrapQty',
    };

    const results = [];

    for (const item of items) {
      const condition = item.condition || 'GOOD';
      const fieldName = conditionFieldMap[condition];

      const currentInventory = await prisma.inventory.findUnique({
        where: {
          centerCode_productId: {
            centerCode: item.centerCode,
            productId: item.productId,
          }
        },
        include: { product: true },
      });

      let inventory;
      let previousQuantity = 0;
      let created = false;

      if (!currentInventory) {
        // Create new inventory record
        const createData = {
          productId: item.productId,
          centerCode: item.centerCode,
          goodQty: 0,
          repairableQty: 0,
          damagedQty: 0,
          scrapQty: 0,
          minStock: item.minStock || 0,
          maxStock: item.maxStock || null,
          location: item.location || null,
        };
        createData[fieldName] = item.quantity;

        inventory = await prisma.inventory.create({
          data: createData,
          include: { product: true },
        });
        created = true;
      } else {
        // Update existing inventory
        previousQuantity = currentInventory[fieldName] || 0;
        inventory = await prisma.inventory.update({
          where: {
            centerCode_productId: {
              centerCode: item.centerCode,
              productId: item.productId,
            }
          },
          data: {
            [fieldName]: previousQuantity + item.quantity,
            updatedAt: new Date(),
          },
          include: { product: true },
        });
      }

      // Create transaction record
      await prisma.productTransaction.create({
        data: {
          transactionType: "RECEIPT",
          centerCode: item.centerCode,
          remarks: notes || `Stock replenishment (${condition})`,
          createdBy: updatedBy || 1,
          items: {
            create: {
              productId: item.productId,
              condition,
              quantity: item.quantity,
            }
          }
        },
      });

      results.push({
        productId: item.productId,
        centerCode: item.centerCode,
        condition,
        product: inventory.product,
        previousQuantity,
        newQuantity: inventory[fieldName],
        addedQuantity: item.quantity,
        created,
      });
    }

    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Adjust inventory (for MACSOFT team to make corrections)
 */
async function adjustInventory(data, userId) {
  try {
    const { productId, centerCode, condition, adjustmentType, quantity, reason } = data;

    const conditionFieldMap = {
      'GOOD': 'goodQty',
      'REPAIRABLE': 'repairableQty',
      'DEFECTIVE': 'damagedQty',
      'SCRAP': 'scrapQty',
    };

    const fieldName = conditionFieldMap[condition];
    if (!fieldName) {
      throw new Error(`Invalid condition: ${condition}`);
    }

    const currentInventory = await prisma.inventory.findUnique({
      where: {
        centerCode_productId: {
          centerCode,
          productId: parseInt(productId),
        }
      },
      include: { product: true },
    });

    if (!currentInventory) {
      throw new Error(`No inventory record found for product ID ${productId} at center ${centerCode}`);
    }

    const currentQty = currentInventory[fieldName] || 0;
    let newQuantity;

    if (adjustmentType === 'ADD') {
      newQuantity = currentQty + parseInt(quantity);
    } else if (adjustmentType === 'SUBTRACT') {
      newQuantity = currentQty - parseInt(quantity);
      if (newQuantity < 0) {
        throw new Error(`Cannot reduce ${condition} quantity below 0. Current: ${currentQty}, Adjustment: ${quantity}`);
      }
    } else if (adjustmentType === 'SET') {
      newQuantity = parseInt(quantity);
    } else {
      throw new Error(`Invalid adjustment type: ${adjustmentType}`);
    }

    const updatedInventory = await prisma.inventory.update({
      where: {
        centerCode_productId: {
          centerCode,
          productId: parseInt(productId),
        }
      },
      data: {
        [fieldName]: newQuantity,
        updatedAt: new Date(),
      },
      include: { product: true, serviceCenter: true },
    });

    // Create adjustment transaction
    await prisma.productTransaction.create({
      data: {
        transactionType: "ADJUSTMENT",
        centerCode,
        remarks: reason || `Inventory adjustment: ${adjustmentType} ${quantity} units (${condition})`,
        createdBy: userId,
        items: {
          create: {
            productId: parseInt(productId),
            condition,
            quantity: parseInt(quantity),
          }
        }
      },
    });

    return {
      ...updatedInventory,
      condition,
      previousQuantity: currentQty,
      newQuantity,
      adjustmentType,
      adjustedQuantity: parseInt(quantity),
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get low stock items (goodQty <= minStock)
 */
async function getLowStockItems(centerCode = null) {
  try {
    const where = centerCode ? { centerCode } : {};

    const allInventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
            category: true,
            brandName: true,
          },
        },
        serviceCenter: {
          select: {
            name: true,
            centerCode: true,
          },
        },
      },
      orderBy: {
        goodQty: "asc",
      },
    });

    // Filter for low stock items (based on goodQty vs minStock)
    const lowStockItems = allInventory.filter((item) => {
      return item.goodQty <= item.minStock;
    });

    // Transform to include condition info
    return lowStockItems.map(item => ({
      ...item,
      quantity: item.goodQty,
      condition: 'GOOD',
    }));
  } catch (error) {
    throw error;
  }
}

/**
 * Get inventory transaction history
 */
async function getInventoryTransactionHistory(productId = null, centerCode = null, limit = 50) {
  try {
    const where = {};
    if (productId) {
      where.items = {
        some: {
          productId: parseInt(productId)
        }
      };
    }
    if (centerCode) {
      where.centerCode = centerCode;
    }

    const transactions = await prisma.productTransaction.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                category: true,
              },
            },
          },
        },
        ticket: {
          select: {
            id: true,
            ticketCode: true,
            description: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        serviceCenter: {
          select: {
            name: true,
            centerCode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return transactions;
  } catch (error) {
    throw error;
  }
}

/**
 * Helper function to get ticket ID from ticket code
 */
async function getTicketIdFromCode(ticketCode) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      select: { id: true },
    });
    return ticket?.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Delete inventory record
 */
async function deleteInventory(productId, centerCode) {
  try {
    await prisma.inventory.delete({
      where: {
        centerCode_productId: {
          centerCode,
          productId: parseInt(productId),
        }
      },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Get inventory record by ID
 */
async function getInventoryById(id) {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true,
        serviceCenter: {
          select: {
            name: true,
            centerCode: true,
          },
        },
      },
    });
    return inventory;
  } catch (error) {
    throw error;
  }
}

/**
 * Get inventory summary for a service center
 */
async function getInventorySummary(centerCode = null) {
  try {
    const where = centerCode ? { centerCode } : {};

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
            category: true,
          },
        },
        serviceCenter: {
          select: {
            name: true,
            centerCode: true,
          },
        },
      },
    });

    // Calculate totals
    const summary = {
      totalProducts: inventory.length,
      totalGoodQty: inventory.reduce((sum, i) => sum + i.goodQty, 0),
      totalRepairableQty: inventory.reduce((sum, i) => sum + i.repairableQty, 0),
      totalDefectiveQty: inventory.reduce((sum, i) => sum + i.damagedQty, 0),
      totalScrapQty: inventory.reduce((sum, i) => sum + i.scrapQty, 0),
      lowStockCount: inventory.filter(i => i.goodQty <= i.minStock).length,
      outOfStockCount: inventory.filter(i => i.goodQty === 0).length,
    };

    return summary;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a complete ProductTransaction with items
 * This function creates the transaction record, items, and updates inventory accordingly
 */
async function createProductTransaction(data) {
  const {
    transactionType,
    centerCode,
    invoiceNo,
    billNo,
    receiptDate,
    deliveryDate,
    ticketId,
    remarks,
    createdBy,
    items
  } = data;

  const conditionFieldMap = {
    'GOOD': 'goodQty',
    'REPAIRABLE': 'repairableQty',
    'DEFECTIVE': 'damagedQty',
    'SCRAP': 'scrapQty',
  };

  try {
    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // For DELIVERY, check stock availability first
      if (transactionType === 'DELIVERY') {
        for (const item of items) {
          const inventory = await tx.inventory.findUnique({
            where: {
              centerCode_productId: {
                centerCode,
                productId: item.productId,
              }
            },
            include: { product: true },
          });

          if (!inventory) {
            throw new Error(`No inventory record found for product ID ${item.productId} at center ${centerCode}`);
          }

          const fieldName = conditionFieldMap[item.condition];
          const availableQty = inventory[fieldName] || 0;

          if (availableQty < item.quantity) {
            throw new Error(
              `Insufficient ${item.condition} stock for ${inventory.product.name}. Available: ${availableQty}, Required: ${item.quantity}`
            );
          }
        }
      }

      // Create the ProductTransaction
      const transaction = await tx.productTransaction.create({
        data: {
          transactionType,
          centerCode,
          invoiceNo,
          billNo,
          receiptDate,
          deliveryDate,
          ticketId,
          remarks,
          createdBy,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              condition: item.condition,
              quantity: item.quantity,
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productCode: true,
                }
              }
            }
          },
          serviceCenter: {
            select: {
              name: true,
              centerCode: true,
            }
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      // Update inventory for each item
      const inventoryUpdates = [];
      for (const item of items) {
        const fieldName = conditionFieldMap[item.condition];

        const currentInventory = await tx.inventory.findUnique({
          where: {
            centerCode_productId: {
              centerCode,
              productId: item.productId,
            }
          },
          include: { product: true },
        });

        let updatedInventory;
        let previousQty = 0;
        let created = false;

        if (transactionType === 'RECEIPT') {
          // Add to inventory
          if (!currentInventory) {
            // Create new inventory record
            const createData = {
              productId: item.productId,
              centerCode,
              goodQty: 0,
              repairableQty: 0,
              damagedQty: 0,
              scrapQty: 0,
              minStock: 0,
              maxStock: null,
              location: null,
            };
            createData[fieldName] = item.quantity;

            updatedInventory = await tx.inventory.create({
              data: createData,
              include: { product: true },
            });
            created = true;
          } else {
            previousQty = currentInventory[fieldName] || 0;
            updatedInventory = await tx.inventory.update({
              where: {
                centerCode_productId: {
                  centerCode,
                  productId: item.productId,
                }
              },
              data: {
                [fieldName]: previousQty + item.quantity,
                updatedAt: new Date(),
              },
              include: { product: true },
            });
          }
        } else {
          // DELIVERY - Deduct from inventory
          previousQty = currentInventory[fieldName] || 0;
          updatedInventory = await tx.inventory.update({
            where: {
              centerCode_productId: {
                centerCode,
                productId: item.productId,
              }
            },
            data: {
              [fieldName]: previousQty - item.quantity,
              updatedAt: new Date(),
            },
            include: { product: true },
          });
        }

        inventoryUpdates.push({
          productId: item.productId,
          productName: updatedInventory.product.name,
          condition: item.condition,
          previousQty,
          newQty: updatedInventory[fieldName],
          quantity: item.quantity,
          created,
        });
      }

      return {
        transaction,
        inventoryUpdates,
      };
    });

    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllInventory,
  getInventoryByProductId,
  getInventoryById,
  upsertInventory,
  checkStockAvailability,
  deductInventory,
  addInventory,
  adjustInventory,
  getLowStockItems,
  getInventoryTransactionHistory,
  deleteInventory,
  getInventorySummary,
  createProductTransaction,
};
