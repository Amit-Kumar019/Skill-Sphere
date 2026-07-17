const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/Users");
const Gig = require("../models/Gig");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const mongoose = require("mongoose");

// ========================= START OR GET CHAT =========================
const createOrGetChat = asyncHandler(async (req, res) => {
    const { recipientId, gigId } = req.body;
    const userId = req.user._id;

    if (!recipientId) {
        throw new ApiError(400, "Recipient ID is required.");
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
        throw new ApiError(404, "Recipient not found.");
    }

    if (userId.toString() === recipientId.toString()) {
        throw new ApiError(400, "You cannot start a chat with yourself.");
    }

    // Build query to find chat between these two participants for a specific gig (or no gig)
    const query = {
        participants: { $all: [userId, new mongoose.Types.ObjectId(recipientId)] }
    };
    if (gigId) {
        query.gig = gigId;
    } else {
        query.gig = null;
    }

    let chat = await Chat.findOne(query)
        .populate("participants", "username firstName lastName avatar role")
        .populate("gig", "title budget status")
        .populate("lastMessage");

    if (!chat) {
        // Create new chat
        chat = await Chat.create({
            participants: [userId, recipientId],
            gig: gigId || null,
            lastMessage: null
        });

        chat = await Chat.findById(chat._id)
            .populate("participants", "username firstName lastName avatar role")
            .populate("gig", "title budget status");
    }

    return res.status(200).json(
        new ApiResponse(200, chat, "Chat initialized successfully.")
    );
});

// ========================= GET MY CHATS =========================
const getMyChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const chats = await Chat.find({
        participants: userId
    })
        .populate("participants", "username firstName lastName avatar role")
        .populate("gig", "title budget status")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "username firstName lastName"
            }
        })
        .sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, chats, "Chats fetched successfully.")
    );
});

// ========================= GET CHAT MESSAGES =========================
const getChatMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, "Chat not found.");
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
        (id) => id.toString() === userId.toString()
    );
    if (!isParticipant) {
        throw new ApiError(403, "You are not authorized to view messages in this chat.");
    }

    // Mark other's messages in this chat as read
    await Message.updateMany(
        { chat: chatId, sender: { $ne: userId }, isRead: false },
        { $set: { isRead: true } }
    );

    const messages = await Message.find({ chat: chatId })
        .populate("sender", "username firstName lastName avatar role")
        .sort({ createdAt: 1 });

    return res.status(200).json(
        new ApiResponse(200, messages, "Messages fetched successfully.")
    );
});

// ========================= SEND MESSAGE =========================
const sendMessage = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message && (!req.files || !req.files.attachments)) {
        throw new ApiError(400, "Message text or attachments are required.");
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, "Chat not found.");
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
        (id) => id.toString() === userId.toString()
    );
    if (!isParticipant) {
        throw new ApiError(403, "You are not authorized to send messages to this chat.");
    }

    // Handle attachments upload
    let uploadedAttachments = [];
    if (req.files && req.files.attachments) {
        for (const file of req.files.attachments) {
            const cloudinaryResponse = await uploadOnCloudinary(file.path, "skillsphere/messages");
            if (cloudinaryResponse) {
                uploadedAttachments.push({
                    url: cloudinaryResponse.secure_url,
                    public_id: cloudinaryResponse.public_id
                });
            }
        }
    }

    // Create Message
    const newMessage = await Message.create({
        chat: chatId,
        sender: userId,
        message: message || "",
        attachments: uploadedAttachments,
        isRead: false
    });

    // Update Chat's lastMessage
    chat.lastMessage = newMessage._id;
    await chat.save();

    const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "username firstName lastName avatar role");

    // Emit socket.io real-time update
    const io = req.app.get("io");
    if (io) {
        // Emit to all participants' personal user rooms
        chat.participants.forEach((p) => {
            io.to(`user_${p.toString()}`).emit("new_message", populatedMessage);
        });

        // Emit a chat notification to other participants' personal rooms for dashboard alerts
        chat.participants.forEach((p) => {
            if (p.toString() !== userId.toString()) {
                io.to(`user_${p.toString()}`).emit("chat_message_notification", {
                    chatId: chatId,
                    senderName: `${req.user.firstName} ${req.user.lastName}`,
                    message: message || "Sent an attachment."
                });
            }
        });
    }

    return res.status(201).json(
        new ApiResponse(201, populatedMessage, "Message sent successfully.")
    );
});

module.exports = {
    createOrGetChat,
    getMyChats,
    getChatMessages,
    sendMessage
};
