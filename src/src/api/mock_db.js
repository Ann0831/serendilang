import { isTestEnv, isTestLoggedIn } from "../environment/env.js";
import { DEFAULT_AVATAR_URL } from "../utils/avatar.js";

export const mockDb = {
  currentUserId: "u1",
  __auth: {
    loggedIn: isTestEnv ? isTestLoggedIn : true,
    lastActionAt: Date.now(),
  },
  users: {
    u1: {
      user_id: "u1",
      username: "tester_one",
      nativelanguage: "Chinese",
      targetlanguage: "English",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "online",
    },
    u2: {
      user_id: "u2",
      username: "alice",
      nativelanguage: "English",
      targetlanguage: "Japanese",
      profile_picture_url: "https://serendilang.com/images/users/0000003IaoFVZ/avatar/b3d0e6984361e676beee4baa6634fa68.jpg",
      realtime_status: "online",
    },
    u3: {
      user_id: "u3",
      username: "bob",
      nativelanguage: "Spanish",
      targetlanguage: "English",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "offline",
    },
    u4: {
      user_id: "u4",
      username: "carol",
      nativelanguage: "Japanese",
      targetlanguage: "Chinese",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "online",
    },
    u5: {
      user_id: "u5",
      username: "david",
      nativelanguage: "French",
      targetlanguage: "English",
      profile_picture_url: "https://serendilang.com/images/users/0000003IaoFVZ/avatar/b3d0e6984361e676beee4baa6634fa68.jpg",
      realtime_status: "online",
    },
    u6: {
      user_id: "u6",
      username: "emma",
      nativelanguage: "German",
      targetlanguage: "Chinese",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "offline",
    },
    u7: {
      user_id: "u7",
      username: "frank",
      nativelanguage: "English",
      targetlanguage: "Korean",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "online",
    },
    u8: {
      user_id: "u8",
      username: "grace",
      nativelanguage: "Korean",
      targetlanguage: "English",
      profile_picture_url: "https://serendilang.com/images/users/0000003IaoFVZ/avatar/b3d0e6984361e676beee4baa6634fa68.jpg",
      realtime_status: "online",
    },
    u9: {
      user_id: "u9",
      username: "henry",
      nativelanguage: "Portuguese",
      targetlanguage: "Spanish",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "offline",
    },
    u10: {
      user_id: "u10",
      username: "iris",
      nativelanguage: "Chinese",
      targetlanguage: "Thai",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "online",
    },
    u11: {
      user_id: "u11",
      username: "jack",
      nativelanguage: "Italian",
      targetlanguage: "English",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "online",
    },
    u12: {
      user_id: "u12",
      username: "karen",
      nativelanguage: "Thai",
      targetlanguage: "Japanese",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "offline",
    },
    u13: {
      user_id: "u13",
      username: "leo",
      nativelanguage: "English",
      targetlanguage: "Chinese",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "online",
    },
    u14: {
      user_id: "u14",
      username: "mia",
      nativelanguage: "Vietnamese",
      targetlanguage: "English",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "online",
    },
    u15: {
      user_id: "u15",
      username: "noah",
      nativelanguage: "Japanese",
      targetlanguage: "Spanish",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "offline",
    },
    u16: {
      user_id: "u16",
      username: "olivia",
      nativelanguage: "Chinese",
      targetlanguage: "French",
      profile_picture_url: DEFAULT_AVATAR_URL,
      realtime_status: "online",
    },
    u17: { user_id: "u17", username: "peter", nativelanguage: "English", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u18: { user_id: "u18", username: "quinn", nativelanguage: "Spanish", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u19: { user_id: "u19", username: "rachel", nativelanguage: "Japanese", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u20: { user_id: "u20", username: "sam", nativelanguage: "French", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u21: { user_id: "u21", username: "tina", nativelanguage: "German", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u22: { user_id: "u22", username: "uma", nativelanguage: "Vietnamese", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u23: { user_id: "u23", username: "vince", nativelanguage: "Korean", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u24: { user_id: "u24", username: "wanda", nativelanguage: "Thai", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u25: { user_id: "u25", username: "xavier", nativelanguage: "Portuguese", targetlanguage: "Spanish", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u26: { user_id: "u26", username: "yuki", nativelanguage: "Japanese", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u27: { user_id: "u27", username: "zoe", nativelanguage: "Chinese", targetlanguage: "Korean", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u28: { user_id: "u28", username: "arthur", nativelanguage: "English", targetlanguage: "French", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u29: { user_id: "u29", username: "bianca", nativelanguage: "Italian", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u30: { user_id: "u30", username: "cedric", nativelanguage: "French", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u31: { user_id: "u31", username: "dora", nativelanguage: "Spanish", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u32: { user_id: "u32", username: "eli", nativelanguage: "English", targetlanguage: "Thai", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u33: { user_id: "u33", username: "fiona", nativelanguage: "German", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u34: { user_id: "u34", username: "gavin", nativelanguage: "Chinese", targetlanguage: "Spanish", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u35: { user_id: "u35", username: "hazel", nativelanguage: "Japanese", targetlanguage: "French", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u36: { user_id: "u36", username: "ian", nativelanguage: "English", targetlanguage: "Vietnamese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u37: { user_id: "u37", username: "jules", nativelanguage: "Korean", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u38: { user_id: "u38", username: "kiki", nativelanguage: "Thai", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u39: { user_id: "u39", username: "liam", nativelanguage: "Portuguese", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u40: { user_id: "u40", username: "mona", nativelanguage: "Vietnamese", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u41: { user_id: "u41", username: "nora", nativelanguage: "English", targetlanguage: "Spanish", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u42: { user_id: "u42", username: "oscar", nativelanguage: "Spanish", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u43: { user_id: "u43", username: "pearl", nativelanguage: "Japanese", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u44: { user_id: "u44", username: "quentin", nativelanguage: "French", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u45: { user_id: "u45", username: "riley", nativelanguage: "German", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u46: { user_id: "u46", username: "sienna", nativelanguage: "Chinese", targetlanguage: "Korean", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u47: { user_id: "u47", username: "travis", nativelanguage: "English", targetlanguage: "French", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u48: { user_id: "u48", username: "ursula", nativelanguage: "Thai", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u49: { user_id: "u49", username: "val", nativelanguage: "Portuguese", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u50: { user_id: "u50", username: "wade", nativelanguage: "Korean", targetlanguage: "Spanish", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u51: { user_id: "u51", username: "xena", nativelanguage: "Italian", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u52: { user_id: "u52", username: "yara", nativelanguage: "Vietnamese", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u53: { user_id: "u53", username: "zane", nativelanguage: "English", targetlanguage: "Thai", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u54: { user_id: "u54", username: "amber", nativelanguage: "Spanish", targetlanguage: "French", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u55: { user_id: "u55", username: "brad", nativelanguage: "Japanese", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u56: { user_id: "u56", username: "claire", nativelanguage: "French", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u57: { user_id: "u57", username: "dylan", nativelanguage: "German", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u58: { user_id: "u58", username: "elena", nativelanguage: "Chinese", targetlanguage: "Spanish", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u59: { user_id: "u59", username: "felix", nativelanguage: "English", targetlanguage: "Portuguese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u60: { user_id: "u60", username: "gina", nativelanguage: "Thai", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u61: { user_id: "u61", username: "hank", nativelanguage: "Portuguese", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u62: { user_id: "u62", username: "ivy", nativelanguage: "Korean", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u63: { user_id: "u63", username: "jon", nativelanguage: "Italian", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u64: { user_id: "u64", username: "kora", nativelanguage: "Vietnamese", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u65: { user_id: "u65", username: "luca", nativelanguage: "English", targetlanguage: "German", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u66: { user_id: "u66", username: "maya", nativelanguage: "Spanish", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u67: { user_id: "u67", username: "nate", nativelanguage: "Japanese", targetlanguage: "French", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u68: { user_id: "u68", username: "orla", nativelanguage: "French", targetlanguage: "Thai", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u69: { user_id: "u69", username: "paul", nativelanguage: "German", targetlanguage: "Korean", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u70: { user_id: "u70", username: "queen", nativelanguage: "Chinese", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u71: { user_id: "u71", username: "ryan", nativelanguage: "English", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u72: { user_id: "u72", username: "sara", nativelanguage: "Thai", targetlanguage: "Spanish", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u73: { user_id: "u73", username: "toby", nativelanguage: "Portuguese", targetlanguage: "French", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u74: { user_id: "u74", username: "una", nativelanguage: "Korean", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u75: { user_id: "u75", username: "vito", nativelanguage: "Italian", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u76: { user_id: "u76", username: "will", nativelanguage: "Vietnamese", targetlanguage: "Spanish", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u77: { user_id: "u77", username: "xim", nativelanguage: "English", targetlanguage: "Korean", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u78: { user_id: "u78", username: "yves", nativelanguage: "Spanish", targetlanguage: "Thai", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u79: { user_id: "u79", username: "zo", nativelanguage: "Japanese", targetlanguage: "English", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u80: { user_id: "u80", username: "aria", nativelanguage: "French", targetlanguage: "Portuguese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u81: { user_id: "u81", username: "benny", nativelanguage: "German", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u82: { user_id: "u82", username: "coco", nativelanguage: "Chinese", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u83: { user_id: "u83", username: "drew", nativelanguage: "English", targetlanguage: "Italian", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u84: { user_id: "u84", username: "eden", nativelanguage: "Thai", targetlanguage: "French", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u85: { user_id: "u85", username: "faye", nativelanguage: "Portuguese", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u86: { user_id: "u86", username: "gabe", nativelanguage: "Korean", targetlanguage: "German", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u87: { user_id: "u87", username: "helen", nativelanguage: "Italian", targetlanguage: "Spanish", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
    u88: { user_id: "u88", username: "ian2", nativelanguage: "Vietnamese", targetlanguage: "Chinese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u89: { user_id: "u89", username: "jade", nativelanguage: "English", targetlanguage: "French", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "online" },
    u90: { user_id: "u90", username: "kyle", nativelanguage: "Spanish", targetlanguage: "Japanese", profile_picture_url: DEFAULT_AVATAR_URL, realtime_status: "offline" },
  },
  friends: [],
  friendRequests: ["u17", "u18", "u19", "u20", "u21", "u22", "u23", "u24", "u25", "u26", "u27", "u28", "u29", "u30", "u31", "u32", "u33", "u34", "u35", "u36"],
  sentFriendRequestIds: [],
  blocks: ["u3", "u9"],
  conversations: {
    u2: {
      other_user: { user_id: "u2", username: "alice" },
      messageText: "Hey there!",
      timestamp: "2026-02-22T09:00:00.000Z",
      sender_id: "u2",
      is_read: 0,
    },
    u3: {
      other_user: { user_id: "u3", username: "bob" },
      messageText: "See you tomorrow.",
      timestamp: "2026-02-21T17:30:00.000Z",
      sender_id: "u1",
      is_read: 1,
    },
    u4: {
      other_user: { user_id: "u4", username: "carol" },
      messageText: "Can we practice Chinese this weekend?",
      timestamp: "2026-02-21T21:12:00.000Z",
      sender_id: "u4",
      is_read: 0,
    },
    u5: {
      other_user: { user_id: "u5", username: "david" },
      messageText: "Thanks for the correction yesterday.",
      timestamp: "2026-02-20T15:42:00.000Z",
      sender_id: "u1",
      is_read: 1,
    },
    u6: {
      other_user: { user_id: "u6", username: "emma" },
      messageText: "Let's exchange voice notes.",
      timestamp: "2026-02-20T10:03:00.000Z",
      sender_id: "u6",
      is_read: 0,
    },
    u7: {
      other_user: { user_id: "u7", username: "frank" },
      messageText: "오늘 어때요?",
      timestamp: "2026-02-19T22:18:00.000Z",
      sender_id: "u7",
      is_read: 1,
    },
    u8: {
      other_user: { user_id: "u8", username: "grace" },
      messageText: "I sent you a new phrase list.",
      timestamp: "2026-02-18T09:40:00.000Z",
      sender_id: "u8",
      is_read: 1,
    },
    u9: {
      other_user: { user_id: "u9", username: "henry" },
      messageText: "Tudo bem?",
      timestamp: "2026-02-17T13:30:00.000Z",
      sender_id: "u9",
      is_read: 0,
    },
    u10: {
      other_user: { user_id: "u10", username: "iris" },
      messageText: "下次再聊，我先去上課。",
      timestamp: "2026-02-16T19:20:00.000Z",
      sender_id: "u10",
      is_read: 1,
    },
    u11: {
      other_user: { user_id: "u11", username: "jack" },
      messageText: "Let's do a 15-minute speaking drill.",
      timestamp: "2026-02-15T08:09:00.000Z",
      sender_id: "u11",
      is_read: 0,
    },
    u12: {
      other_user: { user_id: "u12", username: "karen" },
      messageText: "I can help with Thai tones.",
      timestamp: "2026-02-14T11:55:00.000Z",
      sender_id: "u12",
      is_read: 1,
    },
    u13: {
      other_user: { user_id: "u13", username: "leo" },
      messageText: "Want to do a quick speaking challenge tonight?",
      timestamp: "2026-02-22T10:35:00.000Z",
      sender_id: "u13",
      is_read: 0,
    },
    u14: {
      other_user: { user_id: "u14", username: "mia" },
      messageText: "I shared a pronunciation checklist with you.",
      timestamp: "2026-02-21T12:10:00.000Z",
      sender_id: "u1",
      is_read: 1,
    },
    u15: {
      other_user: { user_id: "u15", username: "noah" },
      messageText: "Could you review my short self-intro paragraph?",
      timestamp: "2026-02-20T07:50:00.000Z",
      sender_id: "u15",
      is_read: 0,
    },
    u16: {
      other_user: { user_id: "u16", username: "olivia" },
      messageText: "Let's exchange 5 useful phrases every morning.",
      timestamp: "2026-02-19T16:40:00.000Z",
      sender_id: "u16",
      is_read: 1,
    },
  },
  conversationMessages: {
    u2: [
      {
        processed_message_id: "m_u2_legacy_1",
        sender_id: "u2",
        messageText: "Long time no see! This was from an older year.",
        timestamp: "2024-11-20T13:05:00.000Z",
        timestamp_ms: Date.parse("2024-11-20T13:05:00.000Z"),
      },
      {
        processed_message_id: "m_u2_legacy_2",
        sender_id: "u1",
        messageText: "Yep, keeping this for timestamp format testing.",
        timestamp: "2024-11-20T13:09:30.000Z",
        timestamp_ms: Date.parse("2024-11-20T13:09:30.000Z"),
      },
      {
        processed_message_id: "m_u2_1",
        sender_id: "u2",
        messageText: "Hey there!",
        timestamp: "2026-02-22T08:57:00.000Z",
        timestamp_ms: Date.parse("2026-02-22T08:57:00.000Z"),
      },
      {
        processed_message_id: "m_u2_2",
        sender_id: "u1",
        messageText: "Hi Alice, how is your Japanese practice?",
        timestamp: "2026-02-22T08:58:30.000Z",
        timestamp_ms: Date.parse("2026-02-22T08:58:30.000Z"),
      },
      {
        processed_message_id: "m_u2_3",
        sender_id: "u2",
        messageText: "Much better this week, thanks!",
        timestamp: "2026-02-22T09:00:00.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:00:00.000Z"),
      },
      {
        processed_message_id: "m_u2_4",
        sender_id: "u1",
        messageText: "Nice! Want to do a quick chat now?",
        timestamp: "2026-02-22T09:00:45.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:00:45.000Z"),
      },
      {
        processed_message_id: "m_u2_5",
        sender_id: "u2",
        messageText: "Sure, let's do it.",
        timestamp: "2026-02-22T09:01:20.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:01:20.000Z"),
      },
      {
        processed_message_id: "m_u2_6",
        sender_id: "u1",
        messageText: "Can you describe your weekend plan?",
        timestamp: "2026-02-22T09:02:10.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:02:10.000Z"),
      },
      {
        processed_message_id: "m_u2_7",
        sender_id: "u2",
        messageText: "I will visit a bookstore and read there.",
        timestamp: "2026-02-22T09:06:20.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:06:20.000Z"),
      },
      {
        processed_message_id: "m_u2_8",
        sender_id: "u1",
        messageText: "That sounds relaxing.",
        timestamp: "2026-02-22T09:06:50.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:06:50.000Z"),
      },
      {
        processed_message_id: "m_u2_9",
        sender_id: "u2",
        messageText: "After that I will write a short diary.",
        timestamp: "2026-02-22T09:07:40.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:07:40.000Z"),
      },
      {
        processed_message_id: "m_u2_10",
        sender_id: "u1",
        messageText: "Great, send it to me and I can help fix grammar.",
        timestamp: "2026-02-22T09:12:10.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:12:10.000Z"),
      },
      {
        processed_message_id: "m_u2_11",
        sender_id: "u2",
        messageText: "Thanks, I'll send it tonight.",
        timestamp: "2026-02-22T09:12:55.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:12:55.000Z"),
      },
      {
        processed_message_id: "m_u2_12",
        sender_id: "u1",
        messageText: "Perfect. Talk later!",
        timestamp: "2026-02-22T09:17:25.000Z",
        timestamp_ms: Date.parse("2026-02-22T09:17:25.000Z"),
      },
    ],
    u4: [
      {
        processed_message_id: "m_u4_1",
        sender_id: "u4",
        messageText: "Can we practice Chinese this weekend?",
        timestamp: "2026-02-21T21:12:00.000Z",
        timestamp_ms: Date.parse("2026-02-21T21:12:00.000Z"),
      },
      {
        processed_message_id: "m_u4_2",
        sender_id: "u1",
        messageText: "Sure, Sunday afternoon works for me.",
        timestamp: "2026-02-21T21:14:00.000Z",
        timestamp_ms: Date.parse("2026-02-21T21:14:00.000Z"),
      },
    ],
    u7: [
      {
        processed_message_id: "m_u7_1",
        sender_id: "u7",
        messageText: "오늘 어때요?",
        timestamp: "2026-02-19T22:18:00.000Z",
        timestamp_ms: Date.parse("2026-02-19T22:18:00.000Z"),
      },
      {
        processed_message_id: "m_u7_2",
        sender_id: "u1",
        messageText: "좋아요! 한국어 연습 중이에요.",
        timestamp: "2026-02-19T22:20:00.000Z",
        timestamp_ms: Date.parse("2026-02-19T22:20:00.000Z"),
      },
      {
        processed_message_id: "m_u7_3",
        sender_id: "u7",
        messageText: "Great, let's do a short voice call later.",
        timestamp: "2026-02-19T22:21:30.000Z",
        timestamp_ms: Date.parse("2026-02-19T22:21:30.000Z"),
      },
    ],
    u10: [
      {
        processed_message_id: "m_u10_1",
        sender_id: "u10",
        messageText: "下次再聊，我先去上課。",
        timestamp: "2026-02-16T19:20:00.000Z",
        timestamp_ms: Date.parse("2026-02-16T19:20:00.000Z"),
      },
      {
        processed_message_id: "m_u10_2",
        sender_id: "u1",
        messageText: "OK，課程順利！",
        timestamp: "2026-02-16T19:21:30.000Z",
        timestamp_ms: Date.parse("2026-02-16T19:21:30.000Z"),
      },
    ],
    u13: [
      {
        processed_message_id: "m_u13_1",
        sender_id: "u13",
        messageText: "Want to do a quick speaking challenge tonight?",
        timestamp: "2026-02-22T10:35:00.000Z",
        timestamp_ms: Date.parse("2026-02-22T10:35:00.000Z"),
      },
      {
        processed_message_id: "m_u13_2",
        sender_id: "u1",
        messageText: "Sure, let's do 10 minutes after dinner.",
        timestamp: "2026-02-22T10:37:00.000Z",
        timestamp_ms: Date.parse("2026-02-22T10:37:00.000Z"),
      },
    ],
    u14: [
      {
        processed_message_id: "m_u14_1",
        sender_id: "u1",
        messageText: "Thanks! I'll check the list tonight.",
        timestamp: "2026-02-21T12:10:00.000Z",
        timestamp_ms: Date.parse("2026-02-21T12:10:00.000Z"),
      },
    ],
    u15: [
      {
        processed_message_id: "m_u15_1",
        sender_id: "u15",
        messageText: "Could you review my short self-intro paragraph?",
        timestamp: "2026-02-20T07:50:00.000Z",
        timestamp_ms: Date.parse("2026-02-20T07:50:00.000Z"),
      },
      {
        processed_message_id: "m_u15_2",
        sender_id: "u1",
        messageText: "Of course. Send it and I'll mark a few suggestions.",
        timestamp: "2026-02-20T07:56:00.000Z",
        timestamp_ms: Date.parse("2026-02-20T07:56:00.000Z"),
      },
    ],
    u16: [
      {
        processed_message_id: "m_u16_1",
        sender_id: "u16",
        messageText: "Let's exchange 5 useful phrases every morning.",
        timestamp: "2026-02-19T16:40:00.000Z",
        timestamp_ms: Date.parse("2026-02-19T16:40:00.000Z"),
      },
    ],
  },
  posts: {
    p1: {
      post_id: "p1",
      author_id: "u2",
      author_name: "alice",
      username: "alice",
      title: "Hello",
      article: "Mock post content 1",
      created_at: "2026-02-20T12:00:00.000Z",
      image_url: "https://serendilang.com/images/posts/6YCu92QevBRzV/691edf7b7dce8ed5.jpg",
      like_count: 2,
    },
    p2: {
      post_id: "p2",
      author_id: "u3",
      author_name: "bob",
      username: "bob",
      title: "Hola",
      article: "Mock post content 2",
      created_at: "2026-02-19T08:00:00.000Z",
      image_url: "",
      like_count: 0,
    },
    p3: {
      post_id: "p3",
      author_id: "u4",
      author_name: "carol",
      username: "carol",
      title: "Daily Practice",
      article: "Today I practiced shadowing for 20 minutes.",
      created_at: "2026-02-18T10:00:00.000Z",
      image_url: "https://serendilang.com/images/posts/6YCu92QevBRzV/691edf7b7dce8ed5.jpg",
      like_count: 5,
    },
    p4: {
      post_id: "p4",
      author_id: "u5",
      author_name: "david",
      username: "david",
      title: "French to English",
      article: "Any good podcast recommendations for intermediate learners?",
      created_at: "2026-02-18T07:20:00.000Z",
      image_url: "",
      like_count: 3,
    },
    p5: {
      post_id: "p5",
      author_id: "u6",
      author_name: "emma",
      username: "emma",
      title: "Word of the Day",
      article: "Persist: to continue firmly even when difficult.",
      created_at: "2026-02-17T16:45:00.000Z",
      image_url: "",
      like_count: 1,
    },
    p6: {
      post_id: "p6",
      author_id: "u7",
      author_name: "frank",
      username: "frank",
      title: "Korean Slang",
      article: "Sharing 5 useful expressions from dramas.",
      created_at: "2026-02-17T09:30:00.000Z",
      image_url: "https://serendilang.com/images/posts/6YCu92QevBRzV/691edf7b7dce8ed5.jpg",
      like_count: 7,
    },
    p7: {
      post_id: "p7",
      author_id: "u8",
      author_name: "grace",
      username: "grace",
      title: "Pronunciation",
      article: "How do you practice connected speech in English?",
      created_at: "2026-02-16T21:05:00.000Z",
      image_url: "",
      like_count: 4,
    },
    p8: {
      post_id: "p8",
      author_id: "u9",
      author_name: "henry",
      username: "henry",
      title: "Study Streak",
      article: "Reached 30 days of language study today.",
      created_at: "2026-02-16T06:40:00.000Z",
      image_url: "",
      like_count: 6,
    },
    p9: {
      post_id: "p9",
      author_id: "u10",
      author_name: "iris",
      username: "iris",
      title: "Chinese Notes",
      article: "整理了常見口語句型，想交換泰文句子。",
      created_at: "2026-02-15T14:10:00.000Z",
      image_url: "https://serendilang.com/images/posts/6YCu92QevBRzV/691edf7b7dce8ed5.jpg",
      like_count: 2,
    },
    p10: {
      post_id: "p10",
      author_id: "u11",
      author_name: "jack",
      username: "jack",
      title: "Listening Tips",
      article: "Try slowing audio to 0.9x first, then 1.0x.",
      created_at: "2026-02-15T08:10:00.000Z",
      image_url: "",
      like_count: 9,
    },
    p11: {
      post_id: "p11",
      author_id: "u12",
      author_name: "karen",
      username: "karen",
      title: "Thai Tones",
      article: "Minimal pairs are super helpful for beginners.",
      created_at: "2026-02-14T20:44:00.000Z",
      image_url: "",
      like_count: 2,
    },
    p12: {
      post_id: "p12",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "My Progress",
      article: "I can finally speak for 3 minutes without notes.",
      created_at: "2026-02-14T12:00:00.000Z",
      image_url: "",
      like_count: 8,
      tags: ["progress", "speaking"],
      location: "Taipei",
      visibility: "public",
    },
    p13: {
      post_id: "p13",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "Daily Reflection",
      article: "Practiced shadowing for 25 minutes and recorded myself.",
      created_at: "2026-02-14T10:10:00.000Z",
      image_url: "",
      like_count: 4,
    },
    p14: {
      post_id: "p14",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "Vocabulary Sprint",
      article: "Learned 30 new words related to travel and directions.",
      created_at: "2026-02-13T19:20:00.000Z",
      image_url: "",
      like_count: 6,
    },
    p15: {
      post_id: "p15",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "Weekend Study Setup",
      article: "Reorganized my study desk and made a better review workflow.",
      created_at: "2026-02-13T08:35:00.000Z",
      image_url: "https://serendilang.com/images/posts/6YCu92QevBRzV/691edf7b7dce8ed5.jpg",
      like_count: 9,
    },
    p16: {
      post_id: "p16",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "Speaking Drill",
      article: "Did a 15-minute monologue without looking at notes.",
      created_at: "2026-02-12T21:00:00.000Z",
      image_url: "",
      like_count: 3,
    },
    p17: {
      post_id: "p17",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "Grammar Check",
      article: "Focused on tense consistency and corrected old writing samples.",
      created_at: "2026-02-12T11:22:00.000Z",
      image_url: "",
      like_count: 5,
    },
    p18: {
      post_id: "p18",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "Listening Notes",
      article: "News podcasts are still hard, but dictation helps a lot.",
      created_at: "2026-02-11T17:46:00.000Z",
      image_url: "",
      like_count: 7,
    },
    p19: {
      post_id: "p19",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "Pronunciation Practice",
      article: "Worked on linking sounds and stress patterns with short clips.",
      created_at: "2026-02-11T09:05:00.000Z",
      image_url: "",
      like_count: 2,
    },
    p20: {
      post_id: "p20",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "Language Exchange",
      article: "Had a good exchange call and got feedback on natural phrasing.",
      created_at: "2026-02-10T20:40:00.000Z",
      image_url: "",
      like_count: 11,
    },
    p21: {
      post_id: "p21",
      author_id: "u1",
      author_name: "tester_one",
      username: "tester_one",
      title: "One More Milestone",
      article: "Finished the week with all tasks complete. Consistency pays off.",
      created_at: "2026-02-10T08:10:00.000Z",
      image_url: "",
      like_count: 10,
    },
    p22: {
      post_id: "p22",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "Self Intro Practice",
      article: "Practiced introducing myself in Chinese for 15 minutes today.",
      created_at: "2026-02-23T09:30:00.000Z",
      image_url: "https://serendilang.com/images/posts/6YCu92QevBRzV/691edf7b7dce8ed5.jpg",
      like_count: 3,
    },
    p23: {
      post_id: "p23",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "New Words",
      article: "Learned 25 Chinese words about daily routine.",
      created_at: "2026-02-22T18:10:00.000Z",
      image_url: "",
      like_count: 1,
    },
    p24: {
      post_id: "p24",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "Listening Notes",
      article: "Listening to slow podcasts really helps my comprehension.",
      created_at: "2026-02-22T08:40:00.000Z",
      image_url: "",
      like_count: 2,
    },
    p25: {
      post_id: "p25",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "Phrase Exchange",
      article: "Can anyone share natural phrases for ordering food?",
      created_at: "2026-02-21T21:05:00.000Z",
      image_url: "",
      like_count: 4,
    },
    p26: {
      post_id: "p26",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "Shadowing Day",
      article: "Did shadowing with drama clips, speed 0.9x then 1.0x.",
      created_at: "2026-02-21T09:25:00.000Z",
      image_url: "https://serendilang.com/images/posts/6YCu92QevBRzV/691edf7b7dce8ed5.jpg",
      like_count: 5,
    },
    p27: {
      post_id: "p27",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "Study Plan",
      article: "Setting a 30-day plan: 20 minutes speaking, 20 minutes listening.",
      created_at: "2026-02-20T20:55:00.000Z",
      image_url: "",
      like_count: 2,
    },
    p28: {
      post_id: "p28",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "Grammar Question",
      article: "When should I use 把 sentences in casual conversation?",
      created_at: "2026-02-20T11:30:00.000Z",
      image_url: "",
      like_count: 6,
    },
    p29: {
      post_id: "p29",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "Speaking Check",
      article: "Recorded my own speaking and found pronunciation issues.",
      created_at: "2026-02-19T19:15:00.000Z",
      image_url: "",
      like_count: 3,
    },
    p30: {
      post_id: "p30",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "Daily Reflection",
      article: "I can understand simple short videos without subtitles now.",
      created_at: "2026-02-19T07:40:00.000Z",
      image_url: "",
      like_count: 4,
    },
    p31: {
      post_id: "p31",
      author_id: "u17",
      author_name: "peter",
      username: "peter",
      title: "Weekend Goal",
      article: "Weekend goal: have one full language exchange call.",
      created_at: "2026-02-18T16:20:00.000Z",
      image_url: "",
      like_count: 2,
    },
  },
  postStats: {
    p1: { views: 128, shares: 3, comments_count: 4 },
    p2: { views: 52, shares: 0, comments_count: 1 },
    p3: { views: 210, shares: 8, comments_count: 9 },
    p4: { views: 95, shares: 2, comments_count: 3 },
    p5: { views: 61, shares: 1, comments_count: 2 },
    p6: { views: 340, shares: 12, comments_count: 11 },
    p7: { views: 180, shares: 4, comments_count: 6 },
    p8: { views: 122, shares: 2, comments_count: 4 },
    p9: { views: 77, shares: 1, comments_count: 2 },
    p10: { views: 289, shares: 7, comments_count: 8 },
    p11: { views: 68, shares: 1, comments_count: 2 },
    p12: { views: 240, shares: 5, comments_count: 7 },
    p13: { views: 136, shares: 2, comments_count: 3 },
    p14: { views: 188, shares: 4, comments_count: 5 },
    p15: { views: 266, shares: 6, comments_count: 8 },
    p16: { views: 104, shares: 1, comments_count: 2 },
    p17: { views: 143, shares: 2, comments_count: 4 },
    p18: { views: 198, shares: 3, comments_count: 6 },
    p19: { views: 87, shares: 1, comments_count: 1 },
    p20: { views: 310, shares: 9, comments_count: 10 },
    p21: { views: 274, shares: 5, comments_count: 7 },
  },
  postComments: {
    p1: [
      { comment_id: "c1", author_id: "u5", content: "Nice one!", created_at: "2026-02-20T12:30:00.000Z" },
      { comment_id: "c2", author_id: "u8", content: "Thanks for sharing.", created_at: "2026-02-20T13:02:00.000Z" },
    ],
    p3: [
      { comment_id: "c3", author_id: "u2", content: "Great discipline.", created_at: "2026-02-18T10:40:00.000Z" },
      { comment_id: "c4", author_id: "u11", content: "Keep going!", created_at: "2026-02-18T11:12:00.000Z" },
    ],
    p10: [
      { comment_id: "c5", author_id: "u1", content: "This helped a lot.", created_at: "2026-02-15T09:40:00.000Z" },
    ],
  },
  likedPostIds: ["p1", "p3", "p7", "p10"],
  postReports: [
    { post_id: "p2", reason: "spam", reported_at: "2026-02-12T09:00:00.000Z" },
  ],
  systemNotifications: [
    { notification_id: "n1", message: "Welcome", is_read: false },
    { notification_id: "n2", message: "You got a new friend request.", is_read: false },
    { notification_id: "n3", message: "Your post received new likes.", is_read: true },
  ],
};

const u2SeedTexts = [
  "How was your study session today?",
  "I reviewed 20 words from yesterday.",
  "Can we do a short speaking drill tonight?",
  "I keep mixing up similar sentence patterns.",
  "Your correction really helped me a lot.",
  "Let's compare our weekly goals tomorrow.",
];

function ensureLargeConversation(targetId, minCount = 120) {
  if (!mockDb.conversationMessages) mockDb.conversationMessages = {};
  const existing = Array.isArray(mockDb.conversationMessages[targetId])
    ? [...mockDb.conversationMessages[targetId]]
    : [];

  if (existing.length >= minCount) return;

  const generated = [];
  const startMs = Date.parse("2025-12-01T00:00:00.000Z");
  for (let i = 1; i <= minCount; i += 1) {
    const sender_id = i % 2 === 0 ? mockDb.currentUserId : targetId;
    const text = u2SeedTexts[(i - 1) % u2SeedTexts.length];
    const timestampMs = startMs + i * 5 * 60 * 1000;
    const timestamp = new Date(timestampMs).toISOString();
    generated.push({
      processed_message_id: `m_${targetId}_seed_${i}`,
      sender_id,
      messageText: text,
      timestamp,
      timestamp_ms: timestampMs,
    });
  }

  const mergedById = new Map();
  [...generated, ...existing].forEach((m) => {
    if (!m?.processed_message_id) return;
    mergedById.set(m.processed_message_id, m);
  });
  const merged = [...mergedById.values()].sort((a, b) => (a?.timestamp_ms || 0) - (b?.timestamp_ms || 0));
  mockDb.conversationMessages[targetId] = merged;

  const latest = merged[merged.length - 1];
  if (!latest) return;
  const summary = mockDb.conversations[targetId] || {
    other_user: { user_id: targetId, username: mockDb.users[targetId]?.username || targetId },
    is_read: 0,
  };
  summary.messageText = latest.messageText;
  summary.timestamp = latest.timestamp;
  summary.sender_id = latest.sender_id;
  mockDb.conversations[targetId] = summary;
}

ensureLargeConversation("u2", 120);

function seedOnlineUsers(ids = []) {
  ids.forEach((id) => {
    if (mockDb.users?.[id]) {
      mockDb.users[id].realtime_status = "online";
    }
  });
}

seedOnlineUsers([
  "u2", "u4", "u5", "u7", "u8", "u10", "u11", "u13", "u14", "u16",
  "u17", "u19", "u20", "u22", "u23", "u25", "u26", "u28", "u29", "u31", "u32",
  "u34", "u35", "u37", "u38", "u40", "u41", "u43", "u44", "u46", "u47", "u49",
  "u50", "u52", "u53", "u55", "u56", "u58", "u59", "u61", "u62", "u64", "u65",
  "u67", "u68", "u70", "u71", "u73", "u74", "u76", "u77", "u79", "u80", "u82",
  "u83", "u85", "u86", "u88", "u89",
]);

const ONLINE_RANDOM_INTERVAL_MS = 10_000;
let _lastOnlineRandomBucket = -1;
const ALWAYS_ONLINE_USER_IDS = new Set(["u2"]);

function hashToScore(seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100;
}

function refreshMockOnlinePresenceIfNeeded() {
  const nowBucket = Math.floor(Date.now() / ONLINE_RANDOM_INTERVAL_MS);
  if (nowBucket === _lastOnlineRandomBucket) return;
  _lastOnlineRandomBucket = nowBucket;

  const users = mockDb.users || {};
  const allIds = Object.keys(users);
  if (allIds.length === 0) return;

  // 45%~69% online ratio, changes every 10s.
  const threshold = 45 + ((nowBucket * 17) % 25);
  const selfId = mockDb.currentUserId;

  for (const id of allIds) {
    const user = users[id];
    if (!user) continue;
    if (id === selfId || ALWAYS_ONLINE_USER_IDS.has(id)) {
      user.realtime_status = "online";
      continue;
    }

    const score = hashToScore(`${id}:${nowBucket}`);
    user.realtime_status = score < threshold ? "online" : "offline";
  }
}

export function getCurrentUser() {
  return mockDb.users[mockDb.currentUserId];
}

export function listOnlineUsers() {
  refreshMockOnlinePresenceIfNeeded();
  for (const id of ALWAYS_ONLINE_USER_IDS) {
    if (mockDb.users?.[id]) {
      mockDb.users[id].realtime_status = "online";
    }
  }
  return Object.values(mockDb.users)
    .filter((u) => u.realtime_status === "online")
    .map((u) => u.user_id);
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function appendIncomingMessageToCurrentUser(fromUserId, messageText = "Hey! Are you free to chat now?") {
  const fromId = String(fromUserId || "").trim();
  if (!fromId) return null;
  if (!mockDb.users?.[fromId]) return null;

  if (!mockDb.conversationMessages) mockDb.conversationMessages = {};
  if (!Array.isArray(mockDb.conversationMessages[fromId])) {
    mockDb.conversationMessages[fromId] = [];
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const nextId = `m_${fromId}_incoming_${nowMs}_${Math.random().toString(36).slice(2, 7)}`;
  const row = {
    processed_message_id: nextId,
    sender_id: fromId,
    messageText: String(messageText || ""),
    timestamp: nowIso,
    timestamp_ms: nowMs,
  };

  mockDb.conversationMessages[fromId].push(row);
  mockDb.conversationMessages[fromId].sort((a, b) => (a?.timestamp_ms || 0) - (b?.timestamp_ms || 0));

  const prevSummary = mockDb.conversations?.[fromId] || {};
  mockDb.conversations[fromId] = {
    ...prevSummary,
    other_user: prevSummary?.other_user || {
      user_id: fromId,
      username: mockDb.users[fromId]?.username || fromId,
    },
    messageText: row.messageText,
    timestamp: row.timestamp,
    sender_id: fromId,
    is_read: 0,
  };

  return row;
}
