import { Types } from "mongoose";
import Package from "../models/package.model";
import { CreatePackageDto, UpdatePackageDto } from "../dtos/package.dto";

export const packageRepository = {
  create(mentorId: string, data: CreatePackageDto) {
    return Package.create({ ...data, mentor: mentorId });
  },

  findById(id: string) {
    return Package.findById(id);
  },

  findByIdAndMentor(id: string, mentorId: string) {
    return Package.findOne({ _id: id, mentor: new Types.ObjectId(mentorId) });
  },

  findAllByMentor(mentorId: string) {
    return Package.find({ mentor: new Types.ObjectId(mentorId) })
      .populate("subject", "name slug")
      .sort({ createdAt: -1 });
  },

  countByMentor(mentorId: string) {
    return Package.countDocuments({ mentor: new Types.ObjectId(mentorId) });
  },

  update(id: string, data: UpdatePackageDto) {
    return Package.findByIdAndUpdate(id, data, { new: true });
  },

  delete(id: string) {
    return Package.findByIdAndDelete(id);
  },


  findAllPublic(filter: { search?: string; category?: string; mentor?: string } = {}) {
  const query: Record<string, any> = {};
  if (filter.search) {
    query.title = { $regex: filter.search, $options: "i" };
  }
  if (filter.category) {
    query.subject = filter.category;
  }
  if (filter.mentor) {
    query.mentor = filter.mentor;
  }
  return Package.find(query)
    .populate("subject", "name slug")
    .populate("mentor", "fullname profilePhoto bio")
    .sort({ createdAt: -1 });
},
};