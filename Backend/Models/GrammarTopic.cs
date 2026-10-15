namespace Backend.Models
{
    public class GrammarTopic
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string NameBn { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    public static class GrammarTopicSeed
    {
        public const string OtherCode = "other";

        // SSC English 2nd Paper grammar topics. Ids are fixed because they are seeded by migrations.
        public static readonly GrammarTopic[] All =
        {
            new() { Id = 1, Code = "articles", NameEn = "Articles", NameBn = "আর্টিকেল", SortOrder = 1 },
            new() { Id = 2, Code = "prepositions", NameEn = "Prepositions", NameBn = "প্রিপজিশন", SortOrder = 2 },
            new() { Id = 3, Code = "right-form-of-verbs", NameEn = "Right Form of Verbs", NameBn = "ক্রিয়ার সঠিক রূপ", SortOrder = 3 },
            new() { Id = 4, Code = "tag-questions", NameEn = "Tag Questions", NameBn = "ট্যাগ প্রশ্ন", SortOrder = 4 },
            new() { Id = 5, Code = "narration", NameEn = "Narration (Direct and Indirect Speech)", NameBn = "উক্তি পরিবর্তন", SortOrder = 5 },
            new() { Id = 6, Code = "transformation", NameEn = "Transformation of Sentences", NameBn = "বাক্য রূপান্তর", SortOrder = 6 },
            new() { Id = 7, Code = "completing-sentences", NameEn = "Completing Sentences", NameBn = "বাক্য সম্পূর্ণকরণ", SortOrder = 7 },
            new() { Id = 8, Code = "connectors", NameEn = "Connectors", NameBn = "সংযোজক শব্দ", SortOrder = 8 },
            new() { Id = 9, Code = "suffix-prefix", NameEn = "Suffixes and Prefixes", NameBn = "সাফিক্স ও প্রিফিক্স", SortOrder = 9 },
            new() { Id = 10, Code = "punctuation", NameEn = "Punctuation and Capitalization", NameBn = "বিরামচিহ্ন ও বড় হাতের অক্ষর", SortOrder = 10 },
            new() { Id = 11, Code = OtherCode, NameEn = "Other", NameBn = "অন্যান্য", SortOrder = 99 }
        };
    }
}
