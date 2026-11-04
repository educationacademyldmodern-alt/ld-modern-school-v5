// Reuse the selected timetable paper and its authorized roster.
window.examDates475 = typeof window.examDates475 === "function" ? window.examDates475 : function (host, sheet, isAdmin, save, reload, note, canStart) {
  const panel = document.createElement('details');
  panel.innerHTML = '<summary>बाद की परीक्षा / नई तारीख</summary><label>किसकी परीक्षा<select></select></label><label>परीक्षा की वास्तविक तारीख<input type="date"></label><label>कारण<input type="text"></label><button type="button">तारीख दर्ज करें</button>';
  const picker = panel.querySelector('select');
  picker.add(new Option('विकल्प चुनें',''));
  if (isAdmin) picker.add(new Option('पूरी कक्षा का पेपर स्थगित','paper'));
  for (const row of sheet.rows) {
    if (row.attendance !== 'Present' && row.marks == null)
      picker.add(new Option([row.student_name,row.father_name,row.admission_no].filter(Boolean).join(' • '),row.student_id));
  }
  const [date,reason] = panel.querySelectorAll('input');
  const button = panel.querySelector('button');
  button.onclick = async () => {
    if (!canStart() || button.disabled) return;
    if (!picker.value || !date.value || reason.value.trim().length<3) return note('विद्यार्थी या कक्षा, तारीख और कारण चुनें।');
    button.disabled = true;
    try {
      const actual = date.value;
      const res = await save('ldm_exam_date475',{p_paper:sheet.paper.paper_id,p_student:picker.value==='paper'?null:picker.value,p_before:String(sheet.paper.exam_date).slice(0,10),p_actual:actual,p_revision:sheet.revision,p_reason:reason.value.trim()});
      if (res!==actual) throw Error('तारीख की पुष्टि नहीं मिली। पेपर दोबारा खोलें।');
      if(panel.isConnected) await reload();
    } catch(e) {if(panel.isConnected)note(e.message);}
    finally {button.disabled=false;}
  };
  host.append(panel);
};
