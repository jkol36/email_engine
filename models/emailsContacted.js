import mongoose from 'mongoose'

const emailsContactedSchema = mongoose.Schema({
  email: String,
  timestamp: Date
}, {strict:false})
export default mongoose.model('emailsContacted', emailsContactedSchema)