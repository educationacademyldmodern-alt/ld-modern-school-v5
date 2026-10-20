V379 से पहले की दो web files वापस रखने का rollback.

1. इस ZIP में paper-center-v343.js और teacher-paper-form-v343.html को निकालें.
2. अपने ERP में इन्हीं नाम की files उसी folder में replace करें जहाँ index.html है.
3. index.html को इन files से rename/replace नहीं करना है.
4. नया hindi-typing-v379.js रहने पर भी यह restored form उसे load नहीं करेगा.
5. Browser के ERP tabs बन्द करके फिर खोलें. Laptop पर Ctrl+Shift+R करें.
6. Incognito/private tab में भी अपना ERP URL खोलकर जाँचें; इससे पुरानी cache अलग होगी.

SQL नहीं चलाना है. Database/student data में कोई बदलाव नहीं.
यह पैकेज केवल V379 की बदली दो files को पहले वाले code में वापस रखता है.
आपके live login failure का कारण अभी सत्यापित नहीं हुआ है.
अगर index.html या कोई अन्य file भी बदली गई है, यह ZIP उसे वापस नहीं रखता.
ERP का URL और login पर अटकी screen का screenshot मिलने से आगे सही diagnosis होगा.
