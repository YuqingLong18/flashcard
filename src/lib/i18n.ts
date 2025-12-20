export type Language = "zh" | "en";

export const DEFAULT_LANGUAGE: Language = "zh";
export const LANGUAGE_COOKIE_NAME = "language";

type TranslationEntry = {
  en: string;
  zh: string;
};

type ReplacementValues = Record<string, string | number>;

const translations = {
  "language.ariaLabel": {
    en: "Switch interface language",
    zh: "切换界面语言",
  },
  "language.toggleLabel": {
    en: "Language",
    zh: "语言",
  },
  "language.chinese": {
    en: "中文",
    zh: "中文",
  },
  "language.english": {
    en: "English",
    zh: "English",
  },
  "home.hero.badge": {
    en: "Adaptive Flashcards for Modern Classrooms",
    zh: "为现代课堂打造的自适应闪卡",
  },
  "home.hero.heading": {
    en: "Build decks. Launch live sessions. Coach every student.",
    zh: "创建卡组，开启现场练习，辅导每一位学生。",
  },
  "home.hero.description": {
    en: "Flashrooms lets teachers create rich flashcard decks, generate optional visuals, and run adaptive practice loops that respond to every student's mastery in real time.",
    zh: "Flashrooms 帮助教师打造内容充实的闪卡卡组、可选生成配图，并运行能够实时响应学生掌握情况的自适应练习。",
  },
  "home.hero.dashboardCta": {
    en: "Go to dashboard",
    zh: "前往控制台",
  },
  "home.hero.signInCta": {
    en: "Sign in to manage decks",
    zh: "登录以管理卡组",
  },
  "home.hero.joinCta": {
    en: "Join a session",
    zh: "加入练习",
  },
  "home.snapshot.title": {
    en: "Live session snapshot",
    zh: "实时课堂一览",
  },
  "home.snapshot.description": {
    en: "Students lean on instant feedback while teachers track mastery.",
    zh: "学生依靠即时反馈，教师实时掌握学习进度。",
  },
  "home.snapshot.cardOne.title": {
    en: "Photosynthesis",
    zh: "光合作用",
  },
  "home.snapshot.cardOne.progress": {
    en: "Mastered: 60%",
    zh: "掌握度：60%",
  },
  "home.snapshot.cardOne.response": {
    en: "Last response: I need a refresher…",
    zh: "最近一次回答：我需要复习…",
  },
  "home.snapshot.cardOne.attempts": {
    en: "2 attempts to mastery",
    zh: "距离掌握还差 2 次",
  },
  "home.snapshot.cardTwo.title": {
    en: "Chlorophyll role",
    zh: "叶绿素的作用",
  },
  "home.snapshot.cardTwo.progress": {
    en: "Mastered: 35%",
    zh: "掌握度：35%",
  },
  "home.snapshot.cardTwo.weighted": {
    en: "Weighted for review 🌱",
    zh: "重点复习 🌱",
  },
  "home.snapshot.cardTwo.average": {
    en: "Avg 1.8 refresher clicks",
    zh: "平均 1.8 次复习点击",
  },
  "home.steps.title": {
    en: "Run a session in minutes",
    zh: "几分钟即可发起课堂练习",
  },
  "home.steps.description": {
    en: "Create decks, import terms from CSV, generate visuals, and launch adaptive runs with a single code.",
    zh: "创建卡组、粘贴 CSV 词条、生成配图，只需一个口令就能发起自适应练习。",
  },
  "home.steps.build.label": {
    en: "1. Build",
    zh: "1. 创建",
  },
  "home.steps.build.description": {
    en: "Inline card editor with AI image assist.",
    zh: "内嵌卡片编辑器，AI 辅助配图。",
  },
  "home.steps.share.label": {
    en: "2. Share",
    zh: "2. 分享",
  },
  "home.steps.share.description": {
    en: "Publish & generate a 6-char session code.",
    zh: "发布并生成 6 位课堂口令。",
  },
  "home.steps.coach.label": {
    en: "3. Coach",
    zh: "3. 辅导",
  },
  "home.steps.coach.description": {
    en: "Students loop through cards until mastery unlocks.",
    zh: "学生循环练习卡片直至掌握。",
  },
  "login.page.title": {
    en: "Welcome back",
    zh: "欢迎回来",
  },
  "login.page.subtitle": {
    en: "Sign in to build and run flashcard sessions.",
    zh: "登录以创建并运行闪卡课堂。",
  },
  "login.page.notice": {
    en: "Account access is managed by your program administrator.",
    zh: "账号访问由项目管理员统一管理。",
  },
  "join.page.badge": {
    en: "Students",
    zh: "学生入口",
  },
  "join.page.title": {
    en: "Enter your session code",
    zh: "输入课堂口令",
  },
  "join.page.description": {
    en: "Your teacher will share a 6-character code. Enter it below to start practicing.",
    zh: "老师会提供 6 位课堂口令，在下方输入即可开始练习。",
  },
  "join.page.notice": {
    en: "We only store your responses for this session. No account required.",
    zh: "我们仅保存本次课堂的作答，不需要账号。",
  },
  "teacher.badge": {
    en: "Teacher",
    zh: "教师",
  },
  "teacher.nav.dashboard": {
    en: "Dashboard",
    zh: "教师控制台",
  },
  "teacher.nav.join": {
    en: "Student join",
    zh: "学生加入",
  },
  "dashboard.title": {
    en: "Your decks",
    zh: "我的卡组",
  },
  "dashboard.subtitle": {
    en: "Build content-rich decks, publish when ready, and launch live runs in seconds.",
    zh: "打造内容充实的卡组，准备好即可发布，数秒内开启课堂。",
  },
  "dashboard.empty.title": {
    en: "No decks yet",
    zh: "还没有卡组",
  },
  "dashboard.empty.description": {
    en: "Start by creating a deck. You can add cards individually or import from CSV.",
    zh: "先创建一个卡组，可以逐条添加，也可以从 CSV 导入。",
  },
  "dashboard.deck.cardsLabel": {
    en: "Cards",
    zh: "卡片数量",
  },
  "dashboard.deck.updated": {
    en: "Updated {{distance}}",
    zh: "更新于 {{distance}}",
  },
  "dashboard.deck.published": {
    en: "Published",
    zh: "已发布",
  },
  "dashboard.deck.draft": {
    en: "Draft",
    zh: "草稿",
  },
  "common.build": {
    en: "Build",
    zh: "构建",
  },
  "common.analytics": {
    en: "Analytics",
    zh: "数据分析",
  },
  "deck.build.cardsHeading": {
    en: "Cards",
    zh: "卡片列表",
  },
  "deck.build.generateImages": {
    en: "Generate images",
    zh: "生成配图",
  },
  "deck.build.generateImagesCount": {
    en: "Generate images ({{count}})",
    zh: "生成配图（{{count}}）",
  },
  "deck.build.generatingStatus": {
    en: "Generating… ({{completed}}/{{total}})",
    zh: "正在生成…（{{completed}}/{{total}}）",
  },
  "deck.build.workingOn": {
    en: "Working on \"{{front}}\"",
    zh: "正在处理“{{front}}”",
  },
  "analytics.header.subtitle": {
    en: "Session analytics",
    zh: "课堂分析",
  },
  "analytics.header.back": {
    en: "Back to builder",
    zh: "返回构建页",
  },
  "analytics.stats.students": {
    en: "Students participated",
    zh: "参与学生数",
  },
  "analytics.stats.responses": {
    en: "Total responses",
    zh: "作答总数",
  },
  "analytics.stats.cards": {
    en: "Cards",
    zh: "卡片数量",
  },
  "analytics.table.card": {
    en: "Card",
    zh: "卡片",
  },
  "analytics.table.mastered": {
    en: "Mastered",
    zh: "掌握率",
  },
  "analytics.table.avgKnows": {
    en: "Avg knows",
    zh: "平均掌握次数",
  },
  "analytics.table.refresherClicks": {
    en: "Refresher clicks",
    zh: "复习点击",
  },
  "play.error.missingPlayer.title": {
    en: "Missing player",
    zh: "缺少玩家信息",
  },
  "play.error.missingPlayer.text": {
    en: "We couldn't find your session. Return to the join page and enter the code again.",
    zh: "没有找到你的课堂，请返回加入页重新输入课堂口令。",
  },
  "play.error.linkBack": {
    en: "Back to join",
    zh: "返回学生入口",
  },
  "play.error.runNotFound.title": {
    en: "Run not found",
    zh: "未找到课堂",
  },
  "play.error.runNotFound.text": {
    en: "This session may have ended or expired.",
    zh: "课堂可能已结束或失效。",
  },
  "play.error.leftRun.title": {
    en: "You left the run",
    zh: "你已离开课堂",
  },
  "play.error.leftRun.text": {
    en: "Ask your teacher for a fresh code to rejoin.",
    zh: "向老师获取新的口令后再加入。",
  },
  "login.form.usernameLabel": {
    en: "Username",
    zh: "用户名",
  },
  "login.form.usernamePlaceholder": {
    en: "Enter your username",
    zh: "请输入用户名",
  },
  "login.form.passwordLabel": {
    en: "Password",
    zh: "密码",
  },
  "login.form.passwordPlaceholder": {
    en: "••••••••",
    zh: "••••••••",
  },
  "login.form.submit": {
    en: "Sign In",
    zh: "登录",
  },
  "login.form.submitting": {
    en: "Signing in...",
    zh: "正在登录...",
  },
  "login.form.toastError": {
    en: "Unable to sign in. Check your credentials.",
    zh: "登录失败，请检查账号和密码。",
  },
  "login.form.toastSuccess": {
    en: "Welcome back!",
    zh: "欢迎回来！",
  },
  "login.form.validation.username": {
    en: "Username is required.",
    zh: "请填写用户名。",
  },
  "login.form.validation.password": {
    en: "Password is required.",
    zh: "请填写密码。",
  },
  "auth.signOut": {
    en: "Sign out",
    zh: "退出登录",
  },
  "auth.signingOut": {
    en: "Signing out...",
    zh: "正在退出...",
  },
  "deck.create.openButton": {
    en: "New deck",
    zh: "新建卡组",
  },
  "deck.create.dialogTitle": {
    en: "Create a new deck",
    zh: "创建新卡组",
  },
  "deck.create.dialogDescription": {
    en: "Give your deck a name and optional metadata. You can add cards right away.",
    zh: "为卡组命名并补充信息，随后即可添加卡片。",
  },
  "deck.create.titleLabel": {
    en: "Title",
    zh: "标题",
  },
  "deck.create.titlePlaceholder": {
    en: "Cell structure review",
    zh: "细胞结构复习",
  },
  "deck.create.descriptionLabel": {
    en: "Description",
    zh: "简介",
  },
  "deck.create.descriptionPlaceholder": {
    en: "Supports Grade 9 biology lesson 4.",
    zh: "配合九年级生物第 4 课。",
  },
  "deck.create.languageLabel": {
    en: "Language (optional)",
    zh: "语言（可选）",
  },
  "deck.create.languagePlaceholder": {
    en: "en",
    zh: "zh",
  },
  "deck.create.submitting": {
    en: "Creating...",
    zh: "正在创建...",
  },
  "deck.create.submit": {
    en: "Create deck",
    zh: "创建卡组",
  },
  "deck.create.success": {
    en: "Deck created.",
    zh: "卡组已创建。",
  },
  "deck.create.error": {
    en: "Failed to create deck.",
    zh: "创建卡组失败。",
  },
  "deck.create.validation.short": {
    en: "Title is too short.",
    zh: "标题太短。",
  },
  "deck.create.validation.long": {
    en: "Title is too long.",
    zh: "标题太长。",
  },
  "deck.play.button": {
    en: "Play deck",
    zh: "发起课堂",
  },
  "deck.play.starting": {
    en: "Starting...",
    zh: "正在启动...",
  },
  "deck.play.error": {
    en: "Unable to start run.",
    zh: "无法开启课堂。",
  },
  "deck.play.success": {
    en: "Session is live. Share the code with students.",
    zh: "课堂已开启，将口令分享给学生。",
  },
  "deck.play.dialogTitle": {
    en: "Session code",
    zh: "课堂口令",
  },
  "deck.play.dialogDescription": {
    en: "Ask students to visit join.flashrooms.app (your domain) and enter this code.",
    zh: "请学生访问 join.flashrooms.app（或你的域名）并输入此口令。",
  },
  "deck.play.shareLabel": {
    en: "Share this code",
    zh: "将此口令告诉学生",
  },
  "deck.play.expires": {
    en: "Expires {{time}}",
    zh: "有效期至 {{time}}",
  },
  "deck.builder.ai.descriptionMin": {
    en: "Please describe the deck (10+ characters).",
    zh: "请至少用 10 个字符描述卡组。",
  },
  "deck.builder.ai.descriptionMax": {
    en: "Keep descriptions under 600 characters.",
    zh: "描述请少于 600 个字符。",
  },
  "deck.builder.ai.countInteger": {
    en: "Card count must be a whole number.",
    zh: "卡片数量必须是整数。",
  },
  "deck.builder.ai.countMin": {
    en: "You can request at least 1 card.",
    zh: "至少请求 1 张卡片。",
  },
  "deck.builder.ai.countMax": {
    en: "You can request at most 20 cards.",
    zh: "最多请求 20 张卡片。",
  },
  "deck.builder.images.allHave": {
    en: "All cards already have images.",
    zh: "所有卡片都已有配图。",
  },
  "deck.builder.images.errorGeneral": {
    en: "Image generation failed.",
    zh: "生成配图失败。",
  },
  "deck.builder.images.singleFail": {
    en: "Image failed for \"{{front}}\"",
    zh: "“{{front}}” 的配图生成失败",
  },
  "deck.builder.images.success": {
    en: "Image generation finished.",
    zh: "配图生成完成。",
  },
  "deck.builder.images.successWithSummary": {
    en: "Image generation finished ({{summary}}).",
    zh: "配图生成完成（{{summary}}）。",
  },
  "deck.builder.images.summary.generated": {
    en: "{{count}} generated",
    zh: "生成 {{count}} 张",
  },
  "deck.builder.images.summary.skipped": {
    en: "{{count}} skipped",
    zh: "跳过 {{count}} 张",
  },
  "deck.builder.images.summary.failed": {
    en: "{{count}} failed",
    zh: "失败 {{count}} 张",
  },
  "deck.builder.images.failedAll": {
    en: "Image generation failed for all cards.",
    zh: "所有卡片的配图生成均失败。",
  },
  "deck.builder.images.failedSome": {
    en: "Image generation completed with some failures.",
    zh: "配图生成已完成，但存在失败项。",
  },
  "deck.builder.images.placeholderFront": {
    en: "Card",
    zh: "卡片",
  },
  "deck.metadata.heading": {
    en: "Deck settings",
    zh: "卡组设置",
  },
  "deck.metadata.toast.updateError": {
    en: "Failed to update deck.",
    zh: "更新卡组失败。",
  },
  "deck.metadata.toast.updateSuccess": {
    en: "Deck details saved.",
    zh: "卡组信息已保存。",
  },
  "deck.metadata.toast.publishError": {
    en: "Unable to update publish state.",
    zh: "无法更新发布状态。",
  },
  "deck.metadata.toast.published": {
    en: "Deck published.",
    zh: "卡组已发布。",
  },
  "deck.metadata.toast.unpublished": {
    en: "Deck unpublished.",
    zh: "卡组已设为未发布。",
  },
  "deck.metadata.publishButton.updating": {
    en: "Updating...",
    zh: "正在更新...",
  },
  "deck.metadata.publishButton.publish": {
    en: "Publish",
    zh: "发布",
  },
  "deck.metadata.publishButton.unpublish": {
    en: "Unpublish",
    zh: "取消发布",
  },
  "deck.metadata.form.titleLabel": {
    en: "Title",
    zh: "标题",
  },
  "deck.metadata.form.descriptionLabel": {
    en: "Description",
    zh: "简介",
  },
  "deck.metadata.form.languageLabel": {
    en: "Language",
    zh: "语言",
  },
  "deck.metadata.form.languagePlaceholder": {
    en: "en",
    zh: "zh",
  },
  "deck.metadata.form.saving": {
    en: "Saving...",
    zh: "正在保存...",
  },
  "deck.metadata.form.save": {
    en: "Save changes",
    zh: "保存修改",
  },
  "deck.metadata.notice": {
    en: "Publish to allow live runs. Students can only join published decks.",
    zh: "发布后才能开启课堂，学生只能加入已发布的卡组。",
  },
  "deck.bulk.heading": {
    en: "Bulk import",
    zh: "批量导入",
  },
  "deck.bulk.instructions": {
    en: "Paste CSV rows that include the columns shown below.",
    zh: "粘贴包含下列字段的 CSV 数据即可。",
  },
  "deck.bulk.error.empty": {
    en: "Add at least one row with front,back values.",
    zh: "请至少提供一行包含 front、back 的数据。",
  },
  "deck.bulk.error.failed": {
    en: "Import failed.",
    zh: "导入失败。",
  },
  "deck.bulk.success": {
    en: "Imported {{count}} cards.",
    zh: "已导入 {{count}} 张卡片。",
  },
  "deck.bulk.importing": {
    en: "Importing...",
    zh: "正在导入...",
  },
  "deck.bulk.importButton": {
    en: "Import {{count}} row",
    zh: "导入 {{count}} 行",
  },
  "deck.bulk.importButtonPlural": {
    en: "Import {{count}} rows",
    zh: "导入 {{count}} 行",
  },
  "deck.bulk.placeholder": {
    en: "photosynthesis,process used by plants to convert light energy\nchlorophyll,pigment that absorbs light",
    zh: "光合作用,植物把光能转成化学能的过程\n叶绿素,帮助吸收光的色素",
  },
  "deck.ai.trigger": {
    en: "AI suggestion",
    zh: "AI 建议",
  },
  "deck.ai.title": {
    en: "AI suggestions",
    zh: "AI 建议",
  },
  "deck.ai.description": {
    en: "Describe the cards you need and we'll draft them for you.",
    zh: "描述你需要的卡片，AI 将为你草拟。",
  },
  "deck.ai.languageLabel": {
    en: "Language: {{language}}",
    zh: "语言：{{language}}",
  },
  "deck.ai.form.promptLabel": {
    en: "What do you need?",
    zh: "你需要哪些内容？",
  },
  "deck.ai.form.promptPlaceholder": {
    en: "Introduce the topic, goals, level, or standards you want these cards to cover.",
    zh: "说明主题、目标、年级或想覆盖的标准。",
  },
  "deck.ai.form.countLabel": {
    en: "Number of cards",
    zh: "卡片数量",
  },
  "deck.ai.submit": {
    en: "Add cards",
    zh: "添加卡片",
  },
  "deck.ai.submitting": {
    en: "Generating...",
    zh: "正在生成...",
  },
  "deck.ai.toast.error": {
    en: "AI suggestions failed.",
    zh: "AI 建议生成失败。",
  },
  "deck.ai.toast.empty": {
    en: "The AI response did not add any cards. Try refining your description.",
    zh: "AI 没有生成卡片，请尝试更具体的描述。",
  },
  "deck.ai.toast.success": {
    en: "Added {{count}} AI-generated card(s).",
    zh: "已添加 {{count}} 张 AI 卡片。",
  },
  "deck.card.add": {
    en: "Add card",
    zh: "添加卡片",
  },
  "deck.card.newTitle": {
    en: "New card",
    zh: "新建卡片",
  },
  "deck.card.newDescription": {
    en: "Provide the answer (back). Front can stay blank and will be generated automatically. Drag & drop an image or let AI create one.",
    zh: "先填写答案（背面），正面可留空由 AI 生成；也可拖拽图片或交给 AI 生成。",
  },
  "deck.card.backLabel": {
    en: "Back (Answer/Keyword) *",
    zh: "反面（答案/关键词）*",
  },
  "deck.card.backPlaceholder": {
    en: "Enter the answer or keyword...",
    zh: "输入答案或关键词...",
  },
  "deck.card.frontLabel": {
    en: "Front (optional — auto-generated if empty)",
    zh: "正面（可选，留空则自动生成）",
  },
  "deck.card.frontPlaceholder": {
    en: "Leave empty to auto-generate from back...",
    zh: "留空则根据反面自动生成...",
  },
  "deck.card.imageLabel": {
    en: "Image (optional)",
    zh: "配图（可选）",
  },
  "deck.card.imageDrop": {
    en: "Drag & drop an image here, or click to browse",
    zh: "将图片拖到此处，或点击浏览",
  },
  "deck.card.imageRemove": {
    en: "Remove",
    zh: "移除",
  },
  "deck.card.imageBrowse": {
    en: "Browse files",
    zh: "浏览文件",
  },
  "deck.card.imageHint": {
    en: "If no image is provided, AI will generate one automatically",
    zh: "若不上传图片，将由 AI 自动生成",
  },
  "deck.card.state.generatingFront": {
    en: "Generating front...",
    zh: "正在生成正面...",
  },
  "deck.card.state.generatingImage": {
    en: "Generating image...",
    zh: "正在生成配图...",
  },
  "deck.card.state.adding": {
    en: "Adding...",
    zh: "正在添加...",
  },
  "deck.card.toast.uploadInvalid": {
    en: "Please upload an image file.",
    zh: "请上传图片文件。",
  },
  "deck.card.toast.uploadInitFailed": {
    en: "Failed to get upload URL",
    zh: "获取上传地址失败",
  },
  "deck.card.toast.uploadMissingUrl": {
    en: "Upload URL missing from response.",
    zh: "响应中缺少上传地址。",
  },
  "deck.card.toast.uploadFailed": {
    en: "Failed to upload image.",
    zh: "上传图片失败。",
  },
  "deck.card.toast.uploadFailedWithReason": {
    en: "Failed to upload image: {{message}}",
    zh: "上传图片失败：{{message}}",
  },
  "deck.card.toast.generateFrontError": {
    en: "Failed to generate front: {{message}}",
    zh: "生成正面失败：{{message}}",
  },
  "deck.card.toast.generateFrontFallback": {
    en: "Failed to generate front description.",
    zh: "生成正面说明失败。",
  },
  "deck.card.toast.frontRequired": {
    en: "Front is required. Please provide a front or ensure it was generated.",
    zh: "需要填写正面内容，请输入或重新生成。",
  },
  "deck.card.toast.generateImageFailed": {
    en: "Failed to generate image",
    zh: "生成配图失败",
  },
  "deck.card.toast.continueWithoutImage": {
    en: "Continuing without an image because generation failed.",
    zh: "配图生成失败，将在无配图的情况下继续。",
  },
  "deck.card.toast.addFailed": {
    en: "Failed to add card.",
    zh: "添加卡片失败。",
  },
  "deck.card.toast.addSuccess": {
    en: "Card added.",
    zh: "卡片已添加。",
  },
  "deck.table.empty": {
    en: "No cards yet. Add your first one to get started.",
    zh: "还没有卡片，先添加一张试试。",
  },
  "deck.table.front": {
    en: "Front",
    zh: "正面",
  },
  "deck.table.back": {
    en: "Back",
    zh: "反面",
  },
  "deck.table.image": {
    en: "Image",
    zh: "配图",
  },
  "deck.table.actions": {
    en: "Actions",
    zh: "操作",
  },
  "deck.table.none": {
    en: "None",
    zh: "无",
  },
  "deck.table.viewImage": {
    en: "View image",
    zh: "查看配图",
  },
  "deck.card.edit.trigger": {
    en: "Edit",
    zh: "编辑",
  },
  "deck.card.edit.title": {
    en: "Edit card",
    zh: "编辑卡片",
  },
  "deck.card.edit.description": {
    en: "Update content, attach or remove imagery, and save changes.",
    zh: "更新内容、添加或移除配图并保存。",
  },
  "deck.card.edit.customPromptLabel": {
    en: "Custom image prompt (optional)",
    zh: "自定义配图提示（可选）",
  },
  "deck.card.edit.customPromptHelp": {
    en: "When provided, this prompt is sent to the image model instead of the automatic prompt.",
    zh: "填写后将使用该提示词生成配图，而不是自动提示。",
  },
  "deck.card.edit.noImage": {
    en: "No image attached.",
    zh: "暂无配图。",
  },
  "deck.card.edit.generate": {
    en: "Generate",
    zh: "生成",
  },
  "deck.card.edit.upload": {
    en: "Upload",
    zh: "上传",
  },
  "deck.card.edit.removeImage": {
    en: "Remove",
    zh: "移除",
  },
  "deck.card.edit.delete": {
    en: "Delete card",
    zh: "删除卡片",
  },
  "deck.card.edit.save": {
    en: "Save changes",
    zh: "保存修改",
  },
  "deck.card.edit.generating": {
    en: "Generating...",
    zh: "正在生成...",
  },
  "deck.card.edit.uploading": {
    en: "Uploading...",
    zh: "正在上传...",
  },
  "deck.card.edit.deleting": {
    en: "Deleting...",
    zh: "正在删除...",
  },
  "deck.card.edit.saving": {
    en: "Saving...",
    zh: "正在保存...",
  },
  "deck.card.edit.updateError": {
    en: "Failed to update card.",
    zh: "更新卡片失败。",
  },
  "deck.card.edit.updateSuccess": {
    en: "Card updated.",
    zh: "卡片已更新。",
  },
  "deck.card.edit.deleteError": {
    en: "Unable to delete card.",
    zh: "无法删除卡片。",
  },
  "deck.card.edit.deleteSuccess": {
    en: "Card deleted.",
    zh: "卡片已删除。",
  },
  "deck.card.edit.imageFrontRequired": {
    en: "Front text is required to generate an image.",
    zh: "需要先填写正面内容才能生成配图。",
  },
  "deck.card.edit.imageError": {
    en: "Image generation failed.",
    zh: "生成配图失败。",
  },
  "deck.card.edit.imageAttached": {
    en: "Image attached.",
    zh: "已添加配图。",
  },
  "deck.card.edit.uploadInitError": {
    en: "Upload init failed.",
    zh: "初始化上传失败。",
  },
  "deck.card.edit.uploadError": {
    en: "Upload failed.",
    zh: "上传失败。",
  },
  "deck.card.edit.uploadSuccess": {
    en: "Image uploaded.",
    zh: "图片已上传。",
  },
  "join.form.codeLabel": {
    en: "Session code",
    zh: "课堂口令",
  },
  "join.form.codePlaceholder": {
    en: "ABC123",
    zh: "ABC123",
  },
  "join.form.nicknameLabel": {
    en: "Nickname (optional)",
    zh: "昵称（可选）",
  },
  "join.form.nicknamePlaceholder": {
    en: "Your name",
    zh: "你的名字",
  },
  "join.form.submit": {
    en: "Join session",
    zh: "加入课堂",
  },
  "join.form.submitting": {
    en: "Joining...",
    zh: "正在加入...",
  },
  "join.form.error": {
    en: "Unable to join run.",
    zh: "无法加入课堂。",
  },
  "join.form.success": {
    en: "Joined {{deck}}.",
    zh: "已加入 {{deck}}。",
  },
  "join.form.defaultDeck": {
    en: "run",
    zh: "课堂",
  },
  "join.form.validation.codeMin": {
    en: "Enter at least 4 characters.",
    zh: "请输入至少 4 位口令。",
  },
  "join.form.validation.codeMax": {
    en: "Codes are limited to 12 characters.",
    zh: "口令最多 12 位。",
  },
  "join.form.validation.nickname": {
    en: "Nickname must be at least 1 character.",
    zh: "昵称至少 1 个字符。",
  },
  "common.saving": {
    en: "Saving...",
    zh: "正在保存...",
  },
  "play.toast.nextError": {
    en: "Unable to load next card.",
    zh: "无法加载下一张卡片。",
  },
  "play.toast.summaryError": {
    en: "Unable to load summary.",
    zh: "无法加载总结。",
  },
  "play.toast.answerError": {
    en: "Could not record answer.",
    zh: "无法记录作答。",
  },
  "play.loadingFirstCard": {
    en: "Loading your first card…",
    zh: "正在加载第一张卡片…",
  },
  "play.header.playing": {
    en: "Playing deck",
    zh: "练习中的卡组",
  },
  "play.header.masteredStatus": {
    en: "Mastered {{mastered}} of {{total}} cards",
    zh: "已掌握 {{mastered}} / {{total}} 张卡片",
  },
  "play.finished.title": {
    en: "🎉 All cards mastered!",
    zh: "🎉 已掌握全部卡片！",
  },
  "play.finished.description": {
    en: "Great job! Review what you just practiced below.",
    zh: "太棒了！看看刚刚练习过的内容。",
  },
  "play.finished.joinAnother": {
    en: "Join another session",
    zh: "加入另一堂课",
  },
  "play.finished.cardsHeading": {
    en: "Your cards",
    zh: "本次卡片",
  },
  "play.finished.cardsSubheading": {
    en: "Front, back, and any visuals you saw during practice.",
    zh: "前后内容以及练习时看到的配图。",
  },
  "play.finished.loading": {
    en: "Loading...",
    zh: "加载中...",
  },
  "play.summary.front": {
    en: "Front",
    zh: "正面",
  },
  "play.summary.back": {
    en: "Back",
    zh: "反面",
  },
  "play.summary.image": {
    en: "Image",
    zh: "配图",
  },
  "play.summary.noImage": {
    en: "No image attached.",
    zh: "无配图。",
  },
  "play.summary.empty": {
    en: "No cards to show. Try refreshing the page if this seems wrong.",
    zh: "暂无可展示的卡片，如有疑问请刷新页面。",
  },
  "play.summary.viewImage": {
    en: "View image",
    zh: "查看配图",
  },
  "play.card.prompt": {
    en: "Prompt",
    zh: "提示",
  },
  "play.card.answer": {
    en: "Answer",
    zh: "答案",
  },
  "play.card.knowCount": {
    en: "Know",
    zh: "掌握",
  },
  "play.card.refresherCount": {
    en: "Refresher",
    zh: "复习",
  },
  "play.card.knowStat": {
    en: "Know: {{count}}",
    zh: "掌握：{{count}}",
  },
  "play.card.refresherStat": {
    en: "Refresher: {{count}}",
    zh: "复习：{{count}}",
  },
  "play.controls.refresher": {
    en: "I am not sure...",
    zh: "我不确定...",
  },
  "play.controls.know": {
    en: "I know the answer",
    zh: "我知道答案",
  },
  "play.controls.continue": {
    en: "Continue",
    zh: "继续",
  },
  "play.waiting": {
    en: "Waiting for cards… If this message persists, the run may have ended.",
    zh: "正在等待卡片… 如持续出现，可能是课堂已结束。",
  },
  "play.retry": {
    en: "Try again",
    zh: "重试",
  },
  "play.modal.imageAlt": {
    en: "Card image full view",
    zh: "卡片配图全屏预览",
  },
} as const satisfies Record<string, TranslationEntry>;

export type TranslationKey = keyof typeof translations;

export function resolveLanguage(value?: string | null): Language {
  return value === "en" ? "en" : DEFAULT_LANGUAGE;
}

function formatTemplate(template: string, replacements?: ReplacementValues) {
  if (!replacements) return template;
  return template.replace(/\{\{(.*?)\}\}/g, (_, token: string) => {
    const key = token.trim();
    const replacement = replacements[key];
    return replacement === undefined ? `{{${key}}}` : String(replacement);
  });
}

export function translate(
  language: Language,
  key: TranslationKey,
  replacements?: ReplacementValues,
) {
  const entry = translations[key];
  if (!entry) {
    return key;
  }
  const template = entry[language] ?? entry[DEFAULT_LANGUAGE];
  return formatTemplate(template, replacements);
}

export function createTranslator(language: Language) {
  return function translator(key: TranslationKey, replacements?: ReplacementValues) {
    return translate(language, key, replacements);
  };
}

export type Translator = ReturnType<typeof createTranslator>;
export type { ReplacementValues };
