// dlsite_parser.ts
export function parseWorkDOM(dom: Document, rj: string) {
    const workInfo: any = {};
    workInfo.rj = rj;

    let metaList = dom.getElementsByTagName("meta")
    for (let i = 0; i < metaList.length; i++) {
        let meta = metaList[i];
        if (meta.getAttribute("property") === 'og:image') {
            workInfo.img = meta.content;
            break;
        }
    }

    workInfo.lang = dom.querySelector("html")?.getAttribute("lang");
    
    let workNameNode = dom.getElementById("work_name");
    if (workNameNode) workInfo.title = workNameNode.innerText;
    
    let makerNode = dom.querySelector("span.maker_name");
    if (makerNode) workInfo.circle = (makerNode as HTMLElement).innerText;
    
    let makerLinkNode = dom.querySelector("#work_maker a") as HTMLAnchorElement;
    if (makerLinkNode && makerLinkNode.href) {
        workInfo.circleId = makerLinkNode.href.substring(makerLinkNode.href.lastIndexOf("/") + 1, makerLinkNode.href.lastIndexOf(".")).trim();
    }

    const table_outline = dom.querySelector("table#work_outline") as HTMLTableElement;
    if (table_outline) {
        for (let i = 0, ii = table_outline.rows.length; i < ii; i++) {
            const row = table_outline.rows[i];
            const row_header = row.cells[0].innerText.trim();
            const row_data = row.cells[1];
            const lambda = (text: string) => row_header === text;
            switch (true) {
                case (["販売日", "发售日", "販賣日", "Release date", "판매일", "Lanzamiento", "Veröffentlicht",
                    "Date de sortie", "Tanggal rilis", "Data di rilascio", "Lançamento", "Utgivningsdatum",
                    "วันที่ขาย", "Ngày phát hành"].some(lambda)):
                    workInfo.date = row_data.innerText.trim();
                    break;
                case (["更新情報", "更新信息", "更新資訊", "Update information", "갱신 정보", "Actualizar información",
                    "Aktualisierungen", "Mise à jour des informations", "Perbarui informasi", "Aggiorna informazioni",
                    "Atualizar informações", "Uppdatera information", "ข้อมูลอัปเดต", "Thông tin cập nhật"].some(lambda)):
                    if (row_data.firstChild) {
                        workInfo.update = (row_data.firstChild as Text).data.trim();
                    }
                    break;
                case (["年齢指定", "年龄指定", "年齡指定", "Age", "연령 지정", "Edad", "Altersfreigabe", "Âge", "Batas usia",
                    "Età", "Idade", "Ålder", "การกำหนดอายุ", "Độ tuổi chỉ định"].some(lambda)):
                    workInfo.rating = row_data.innerText.trim();
                    break;
                case (["ジャンル", "分类", "分類", "Genre", "장르", "Género", "Genre", "Genre", "Genre", "Genere", "Gênero",
                    "Genre", "ประเภท", "Thể loại"].some(lambda)):
                    const tag_nodes = row_data.querySelectorAll("a");
                    workInfo.tags = Array.from(tag_nodes).map(a => a.innerText.trim());
                    break;
                case (["シナリオ", "Scenario", "剧情", "劇本", "시나리오", "Guión", "Szenario", "Scénario", "Skenario",
                    "Scenario", "Cenário", "Scenario", "บทละคร", "Kịch bản"].some(lambda)):
                    workInfo.scenario = row_data.innerText.trim();
                    break;
                case (["イラスト", "Illustration", "插画", "插畫", "일러스트", "Ilustración", "AbbilDung", "Illustration",
                    "Ilustrasi", "Illustrazione", "Ilustração", "Illustration", "ภาพประกอบ", "Tranh minh họa"].some(lambda)):
                    workInfo.illustration = row_data.innerText.trim();
                    break;
                case (["声優", "声优", "聲優", "Voice Actor", "성우", "Doblador", "Synchronsprecher", "Doubleur",
                    "Pengisi suara", "Doppiatore/Doppiatrice", "Ator de voz", "Röstskådespelare", "นักพากย์",
                    "Diễn viên lồng tiếng"].some(lambda)):
                    workInfo.cv = row_data.innerText.trim();
                    break;
                case (["音楽", "Music", "音乐", "音樂", "음악", "Música", "Musik", "Musique", "Musik", "Musica.",
                    "Música", "musik", "ดนตรี", "Âm nhạc"].some(lambda)):
                    workInfo.music = row_data.innerText.trim();
                    break;
                case (["ファイル容量", "文件容量", "檔案容量", "File size", "파일 용량", "Tamaño del Archivo", "Dateigröße",
                    "Taille du fichier", "Ukuran file", "Dimensione del file", "Tamanho do arquivo", "Filstorlek",
                    "ขนาดไฟล์", "Dung lượng tệp"].some(lambda)):
                    workInfo.filesize = row_data.innerText.trim();
                    break;
                default:
                    break;
            }
        }
    }

    const work_date_ana = dom.querySelector("strong.work_date_ana") as HTMLElement;
    if (work_date_ana) {
        workInfo.dateAnnounce = work_date_ana.innerText;
    }

    return workInfo;
}

export function getLangCode(lang?: string) {
    if (!lang) return "ja-JP";

    switch (lang.toUpperCase()) {
        case "JPN": return "ja-JP";
        case "ENG": return "en-US";
        case "KO_KR": return "ko-KR";
        case "CHI_HANS": return "zh-CN";
        case "CHI_HANT": return "zh-TW";
        default: return "ja-JP"
    }
}

export function parseApiData(rjCode: string, data: any) {
    if (!data) data = {};
    let apiData = data;
    apiData.is_bonus = !data.is_sale && data.is_free && data.is_oly && data.wishlist_count === false;
    apiData.is_girls = (data.options && data.options.indexOf("OTM") >= 0) || (data.site_id === "girls");

    if (data.regist_date) {
        let reg_date = data.regist_date.replace(/-/g, '/');
        let releaseDate = new Date(reg_date);
        apiData.regist_timestamp = releaseDate.getTime();
        apiData.regist_date = `${releaseDate.getFullYear()} / ${releaseDate.getMonth() + 1} / ${releaseDate.getDate()}`;
        if (apiData.regist_timestamp > Date.now()) {
            apiData.is_announce = true;
        }
    }
    return apiData;
}

export function parseApi2Data(rjCode: string, data: any) {
    if (!data) return {};
    const translation_info = data.translation_info ? data.translation_info : {};
    data.lang = getLangCode(translation_info.lang);

    if (data.regist_date) {
        let reg_date = data.regist_date.replace(/-/g, '/');
        let releaseDate = new Date(reg_date);
        data.regist_timestamp = releaseDate.getTime();
        data.regist_date = `${releaseDate.getFullYear()} / ${releaseDate.getMonth() + 1} / ${releaseDate.getDate()}`;
        if (data.regist_timestamp > Date.now()) {
            data.is_announce = true;
        }
    }

    return data;
}

export function getParentWorkRjCode(redirectUrl: string) {
    const reg = new RegExp("(?<=product_id/)((R[JE][0-9]{8})|(R[JE][0-9]{6})|([VB]J[0-9]{8})|([VB]J[0-9]{6}))")
    const match = redirectUrl.match(reg);
    return match ? match[0] : null;
}
