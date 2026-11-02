/* Keep the original diagnostic visible beneath an actionable explanation. */
window.ldmExplain464=function(value){
 const raw=String(value?.message||value||'');
 let hint='';
 if(/schema cache|could not find the function/i.test(raw))hint=/ldm_(?:teacher_(?:exam464|save464)|staff_preview464)|ldm_aw_registry/.test(raw)?'Admin: RUN_ONCE_V464_REPAIR.sql चलाएँ और पेज फिर खोलें।':'डेटाबेस सेवा नहीं मिली। Admin संबंधित SQL और उसका नाम जाँचें।';
 else if(/permission denied|row.level security|outside assigned|assigned teacher/i.test(raw))hint='इस खाते को चुनी हुई कक्षा, सेक्शन या काम की अनुमति नहीं मिली। Admin असाइनमेंट जाँचें।';
 else if(/failed to fetch|networkerror|timeout|server response uncertain/i.test(raw))hint='नेटवर्क से पुष्टि नहीं मिली। सेव की स्थिति जाँचें और उसी अनुरोध से फिर कोशिश करें।';
 else if(/maximum marks|set maximum/i.test(raw))hint='पहले इस पेपर के कुल अंक निर्धारित करें।';
 else if(/changed elsewhere|revision conflict|roster changed/i.test(raw))hint='रिकॉर्ड दूसरे सत्र में बदला है। ताज़ा रिकॉर्ड खोलकर अपने अंक मिलाएँ।';
 return hint&&!raw.includes(hint)?hint+' ('+raw+')':raw;
};
