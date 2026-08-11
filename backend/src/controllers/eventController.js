const Event = require('../models/Event');
const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');

function cleanEventContent(rawHtml) {
  return sanitizeHtml(rawHtml, {
    allowedTags: ["h1", "h2", "h3", "p", "b", "i", "u", "s", "strong", "em", "ul", "ol", "li", "a", "img", "table", "tr", "td", "span", "br", "div"],
    allowedAttributes: {
      a: ["href", "target"],
      img: ["src", "alt", "title", "width", "height"],
      span: ["style"],
      table: ["border"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      div: ["style"]
    },
    allowedStyles: {
      '*': {
        'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      }
    }
  });
}

const generateUniqueSlug = async (title, currentId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true, locale: 'vi' });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Event.findOne({ slug });
    if (!existing || (currentId && existing._id.toString() === currentId.toString())) {
      break;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

exports.createEvent = async (req, res, next) => {
  try {
    const { title, shortDescription, thumbnailUrl, bannerUrl, content, category, startDate, endDate, isFeatured, status } = req.body;
    
    const slug = await generateUniqueSlug(title);
    const cleanedContent = cleanEventContent(content);

    const event = await Event.create({
      title,
      slug,
      shortDescription,
      thumbnailUrl,
      bannerUrl: bannerUrl || thumbnailUrl,
      content: cleanedContent,
      category,
      startDate,
      endDate: endDate || null,
      isFeatured,
      status,
      createdBy: req.user.id
    });

    res.status(201).json({ message: 'Tạo sự kiện thành công', data: event });
  } catch (error) {
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { title, shortDescription, thumbnailUrl, bannerUrl, content, category, startDate, endDate, isFeatured, status } = req.body;
    
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });

    let slug = event.slug;
    if (title && title !== event.title) {
      slug = await generateUniqueSlug(title, eventId);
    }

    const cleanedContent = cleanEventContent(content);

    const updated = await Event.findByIdAndUpdate(eventId, {
      title,
      slug,
      shortDescription,
      thumbnailUrl,
      bannerUrl: bannerUrl || thumbnailUrl,
      content: cleanedContent,
      category,
      startDate,
      endDate: endDate || null,
      isFeatured,
      status
    }, { new: true, runValidators: true });

    res.json({ message: 'Cập nhật sự kiện thành công', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    res.json({ message: 'Xóa sự kiện thành công' });
  } catch (error) {
    next(error);
  }
};

exports.getAdminEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category, status, sort = 'newest' } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const sortOptions = {};
    if (sort === 'newest') sortOptions.createdAt = -1;
    if (sort === 'oldest') sortOptions.createdAt = 1;
    if (sort === 'views') sortOptions.viewCount = -1;

    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find(query)
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Event.countDocuments(query);

    res.json({
      data: events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPublicEvents = async (req, res, next) => {
  try {
    const { category, limit = 20 } = req.query;
    const now = new Date();
    
    const query = {
      status: 'published',
      $or: [
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    };
    
    if (category) query.category = category;

    const events = await Event.find(query)
      .sort({ isFeatured: -1, startDate: -1 })
      .limit(Number(limit));

    res.json({ data: events });
  } catch (error) {
    next(error);
  }
};

exports.getEventBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug });
    
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });

    // Chỉ đếm view nếu không phải preflight hoặc có cookie,
    // Ở đây đơn giản hóa bằng cách tăng trực tiếp
    event.viewCount += 1;
    await event.save({ timestamps: false });

    res.json({ data: event });
  } catch (error) {
    next(error);
  }
};
