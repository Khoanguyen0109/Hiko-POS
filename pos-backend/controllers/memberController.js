const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { userRoles } = require("../constants/user");

// Admin: Get all members
const getAllMembers = async (req, res, next) => {
    try {
        const members = await User.find({ role: { $ne: userRoles.ADMIN } })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: members,
            count: members.length
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Get member by ID
const getMemberById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            const error = createHttpError(400, "Member ID is required!");
            return next(error);
        }

        const member = await User.findById(id).select('-password');
        if (!member) {
            const error = createHttpError(404, "Member not found!");
            return next(error);
        }

        if (member.role === userRoles.ADMIN) {
            const error = createHttpError(403, "Cannot access admin account!");
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: member
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Create new member
const createMember = async (req, res, next) => {
    try {
        const { name, email, phone, password, role, salary } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password || !role) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        // Validate salary if provided
        if (salary !== undefined && salary < 0) {
            const error = createHttpError(400, "Salary cannot be negative!");
            return next(error);
        }

        // // Validate role (cannot create admin accounts)
        // if (role === userRoles.ADMIN) {
        //     const error = createHttpError(403, "Cannot create admin accounts!");
        //     return next(error);
        // }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = createHttpError(400, "User with this email already exists!");
            return next(error);
        }

        // Check if phone already exists
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            const error = createHttpError(400, "User with this phone number already exists!");
            return next(error);
        }

        // Create new member
        const newMember = new User({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            password,
            role,
            salary: salary !== undefined ? salary : 0
        });

        await newMember.save();

        // Return member data without password
        const memberData = newMember.toObject();
        delete memberData.password;

        res.status(201).json({
            success: true,
            message: "Member created successfully!",
            data: memberData
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Update member
const updateMember = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, salary } = req.body;

        if (!id) {
            const error = createHttpError(400, "Member ID is required!");
            return next(error);
        }

        // Validate salary if provided
        if (salary !== undefined && salary < 0) {
            const error = createHttpError(400, "Salary cannot be negative!");
            return next(error);
        }

        // Find member
        const member = await User.findById(id);
        if (!member) {
            const error = createHttpError(404, "Member not found!");
            return next(error);
        }

        // Prevent updating admin accounts
        if (member.role === userRoles.ADMIN) {
            const error = createHttpError(403, "Cannot modify admin accounts!");
            return next(error);
        }

        // Check if new email already exists (excluding current member)
        if (email && email !== member.email) {
            const existingEmail = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: id } });
            if (existingEmail) {
                const error = createHttpError(400, "Email already in use by another user!");
                return next(error);
            }
        }

        // Check if new phone already exists (excluding current member)
        if (phone && phone !== member.phone) {
            const existingPhone = await User.findOne({ phone: phone.trim(), _id: { $ne: id } });
            if (existingPhone) {
                const error = createHttpError(400, "Phone number already in use by another user!");
                return next(error);
            }
        }

        // Prevent changing role to admin
        if (role && role === userRoles.ADMIN) {
            const error = createHttpError(403, "Cannot assign admin role!");
            return next(error);
        }

        // Update fields
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.trim().toLowerCase();
        if (phone) updateData.phone = phone.trim();
        if (role) updateData.role = role;
        if (salary !== undefined) updateData.salary = salary;

        const updatedMember = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: "Member updated successfully!",
            data: updatedMember
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Delete member
const deleteMember = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            const error = createHttpError(400, "Member ID is required!");
            return next(error);
        }

        const member = await User.findById(id);
        if (!member) {
            const error = createHttpError(404, "Member not found!");
            return next(error);
        }

        // Prevent deleting admin accounts
        if (member.role === userRoles.ADMIN) {
            const error = createHttpError(403, "Cannot delete admin accounts!");
            return next(error);
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Member deleted successfully!"
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Toggle member active status
const toggleMemberActiveStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            const error = createHttpError(400, "Member ID is required!");
            return next(error);
        }

        const member = await User.findById(id);
        if (!member) {
            const error = createHttpError(404, "Member not found!");
            return next(error);
        }

        // Prevent toggling admin accounts
        if (member.role === userRoles.ADMIN) {
            const error = createHttpError(403, "Cannot modify admin accounts!");
            return next(error);
        }

        // Toggle the active status
        member.isActive = !member.isActive;
        await member.save();

        // Return member data without password
        const memberData = member.toObject();
        delete memberData.password;

        res.status(200).json({
            success: true,
            message: `Member ${member.isActive ? 'activated' : 'deactivated'} successfully!`,
            data: memberData
        });
    } catch (error) {
        next(error);
    }
};

// Member: Get own profile
const getOwnProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Member: Update own profile
const updateOwnProfile = async (req, res, next) => {
    try {
        const { name, email, phone } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!name && !email && !phone) {
            const error = createHttpError(400, "At least one field is required to update!");
            return next(error);
        }

        // Check if new email already exists
        if (email && email !== req.user.email) {
            const existingEmail = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: userId } });
            if (existingEmail) {
                const error = createHttpError(400, "Email already in use by another user!");
                return next(error);
            }
        }

        // Check if new phone already exists
        if (phone && phone !== req.user.phone) {
            const existingPhone = await User.findOne({ phone: phone.trim(), _id: { $ne: userId } });
            if (existingPhone) {
                const error = createHttpError(400, "Phone number already in use by another user!");
                return next(error);
            }
        }

        // Update fields
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.trim().toLowerCase();
        if (phone) updateData.phone = phone.trim();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: "Profile updated successfully!",
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

// Member: Change password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            const error = createHttpError(400, "Current password and new password are required!");
            return next(error);
        }

        if (newPassword.length < 6) {
            const error = createHttpError(400, "New password must be at least 6 characters long!");
            return next(error);
        }

        // Get user with password
        const user = await User.findById(userId);
        if (!user) {
            const error = createHttpError(404, "User not found!");
            return next(error);
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            const error = createHttpError(400, "Current password is incorrect!");
            return next(error);
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully!"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Admin functions
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
    toggleMemberActiveStatus,
    
    // Member functions
    getOwnProfile,
    updateOwnProfile,
    changePassword
}; 