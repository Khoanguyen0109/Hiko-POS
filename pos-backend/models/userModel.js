const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
    },

    email : {
        type: String,
        required: false,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow empty email
                return /\S+@\S+\.\S+/.test(v);
            },
            message : "Email must be in valid format!"
        }
    },

    phone: {
        type : String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v.replace(/\s/g, ""));
            },
            message : "Phone number must be exactly 10 digits!"
        }
    },

    password: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        required: true
    },

    salary: {
        type: Number,
        default: 0,
        min: [0, "Salary cannot be negative"]
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps : true })

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')){
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

module.exports = mongoose.model("User", userSchema);