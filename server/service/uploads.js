const { prisma } = require("../lib/clients");

exports.uploadUsers = async (data) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid data format or empty data");
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    // Process users one by one to handle individual failures
    for (let i = 0; i < data.length; i++) {
      const user = data[i];
      
      try {
        // Validate required fields
        if (!user.name || !user.phone || (!user.password && !user.hashedPassword)) {
          results.failed.push({
            row: i + 1,
            data: user,
            error: "Name, phone, and password (or hashedPassword) are required"
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            phone: user.phone,
            deletedAt: null
          }
        });

        if (existingUser) {
          results.skipped.push({
            row: i + 1,
            data: user,
            reason: "User with this phone number already exists"
          });
          continue;
        }

        // Prepare user data
        const createData = {
          name: user.name.toString().trim(),
          phone: user.phone.toString().trim(),
          role: user.role || 'SCE_USER',
          isActive: !user.status || user.status.toString().toUpperCase() === 'ACTIVE'
        };

        // Handle password - use hashedPassword if available (from frontend), otherwise hash the password
        if (user.hashedPassword) {
          createData.password = user.hashedPassword;
        } else if (user.password) {
          createData.password = user.password.toString(); // Will be hashed below
        }

        // Note: Email field is commented out until schema migration is run
        // Add email if provided and email field exists in schema
        // if (user.email && user.email.toString().trim() !== '') {
        //   createData.email = user.email.toString().trim();
        // }

        // Handle organization relationship
        if (user.orgCode || user.organisationCode) {
          const orgCode = user.orgCode || user.organisationCode;
          const serviceCenter = await prisma.serviceCenter.findFirst({
            where: { orgCode: orgCode.toString() }
          });
          
          if (serviceCenter) {
            createData.centerCode = serviceCenter.centerCode;
          }
        }

        // Password is already hashed on frontend, no need to hash again

        // Create user
        const newUser = await prisma.user.create({
          data: createData,
          include: {
            serviceCenter: {
              include: {
                organisation: true
              }
            },
            State: true
          }
        });

        // Remove password from result
        const { password, ...userResult } = newUser;
        results.successful.push({
          row: i + 1,
          user: userResult
        });

      } catch (userError) {
        console.error(`Error processing user at row ${i + 1}:`, userError);
        results.failed.push({
          row: i + 1,
          data: user,
          error: userError.message || "Failed to create user"
        });
      }
    }

    const summary = {
      total: data.length,
      successful: results.successful.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      results: results
    };

    return { 
      ...summary, 
      status: 201, 
      message: `Upload completed: ${summary.successful} successful, ${summary.failed} failed, ${summary.skipped} skipped` 
    };
  } catch (error) {
    console.error("Error uploading users:", error);
    throw new Error(`Failed to upload users: ${error.message}`);
  }
};

exports.uploadOrganisations = async (data) => {
  try {
    const validatedData = data.map((org) => {
      if (!org.name || !org.email || !org.orgCode) {
        throw new Error("Name, email, and orgCode are required for each organisation");
      }
      return org;
    });
    const organisations = [];

    for (const orgData of validatedData) {
      const organisation = await prisma.organisation.upsert({
        where: { orgCode: orgData.orgCode },
        update: orgData,
        create: orgData,
      });
      organisations.push(organisation);
    }

    return { organisations, status: 201, message: "Organisations uploaded successfully" };
  } catch (error) {
    console.error("Error uploading organisations:", error);
    return { status: 500, error: "Failed to upload organisations" };
  }
};

exports.uploadServiceCenters = async (data) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid data format or empty data");
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    // Process service centers one by one to handle individual failures
    for (let i = 0; i < data.length; i++) {
      const center = data[i];
      
      try {
        // Validate required fields
        if (!center.name || !center.centerCode || !center.email) {
          results.failed.push({
            row: i + 1,
            data: center,
            error: "Name, centerCode, and email are required"
          });
          continue;
        }

        // Check if service center already exists
        const existingCenter = await prisma.serviceCenter.findFirst({
          where: {
            OR: [
              { centerCode: center.centerCode.toString() },
              { email: center.email.toString() }
            ],
            deletedAt: null
          }
        });

        if (existingCenter) {
          results.skipped.push({
            row: i + 1,
            data: center,
            reason: "Service center with this centerCode or email already exists"
          });
          continue;
        }

        // Prepare service center data
        const createData = {
          name: center.name.toString().trim(),
          centerCode: center.centerCode.toString().trim(),
          email: center.email.toString().trim(),
          isActive: !center.status || center.status.toString().toUpperCase() === 'ACTIVE'
        };

        // Optional fields
        if (center.orgCode && center.orgCode.toString().trim() !== '') {
          createData.orgCode = center.orgCode.toString().trim();
        }

        if (center.address && center.address.toString().trim() !== '') {
          createData.address = center.address.toString().trim();
        }

        if (center.serviceableStates && center.serviceableStates.toString().trim() !== '') {
          createData.serviceableStates = center.serviceableStates.toString().trim();
        }

        // Create service center
        const newServiceCenter = await prisma.serviceCenter.create({
          data: createData,
          include: {
            organisation: true
          }
        });

        results.successful.push({
          row: i + 1,
          serviceCenter: newServiceCenter
        });

      } catch (centerError) {
        console.error(`Error processing service center at row ${i + 1}:`, centerError);
        results.failed.push({
          row: i + 1,
          data: center,
          error: centerError.message || "Failed to create service center"
        });
      }
    }

    const summary = {
      total: data.length,
      successful: results.successful.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      results: results
    };

    return { 
      ...summary, 
      status: 201, 
      message: `Upload completed: ${summary.successful} successful, ${summary.failed} failed, ${summary.skipped} skipped` 
    };
  } catch (error) {
    console.error("Error uploading service centers:", error);
    throw new Error(`Failed to upload service centers: ${error.message}`);
  }
};

exports.uploadProducts = async (data) => {
  try {
    const validatedData = data.map((product) => {
      if (!product.name || !product.price) {
        throw new Error("Name and price are required for each product");
      }
      return product;
    });
    const products = await prisma.product.createMany({ data: validatedData });
    return { products, status: 201, message: "Products uploaded successfully" };
  } catch (error) {
    console.error("Error uploading products:", error);
    return { status: 500, error: "Failed to upload products" };
  }
};
