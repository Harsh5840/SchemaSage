const {z} = require("zod");
const userSchema = z.object({
    name: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(8),
    avatarUrl: z.string().optional(),
})
module.exports = userSchema;