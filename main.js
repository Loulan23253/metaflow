const {
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
    Notice
} = require("obsidian");


const DEFAULT_SETTINGS = {

    lang: "auto",

    rules:[
        {
            folder:"Agenda",
            properties:{
                type:"calendar",
                source:"ogenda",
                tags:["calendar"]
            }
        }
    ]

};


// —— 双语文案:zh / en,lang=auto 时跟随系统语言 ——
const STRINGS = {

    en:{
        langName:"Interface language",
        langDesc:"Auto follows the system language.",
        addRule:"+ Add rule",
        newRule:"📁 New rule",
        watchedFolder:"Watched folder",
        addProperty:"+ Add property",
        deleteRule:"Delete rule",
        save:"Save",
        delete:"Delete",
        keyExists:"Key already exists — not saved"
    },

    zh:{
        langName:"界面语言",
        langDesc:"Auto 表示跟随系统语言。",
        addRule:"+ 新增规则",
        newRule:"📁 新规则",
        watchedFolder:"监听文件夹",
        addProperty:"+ 添加 Property",
        deleteRule:"删除规则",
        save:"保存",
        delete:"删除",
        keyExists:"该 key 已存在，未保存"
    }

};


module.exports = class MetaFlow extends Plugin {


async onload(){

    await this.loadSettings();


    this.addSettingTab(
        new MetaFlowSettingTab(
            this.app,
            this
        )
    );



    this.registerEvent(

        this.app.vault.on(
            "create",
            file=>{


                if(!(file instanceof TFile))
                    return;


                if(!file.path.endsWith(".md"))
                    return;


                setTimeout(
                    ()=>{
                        this.handleFile(file);
                    },
                    800
                );


            }
        )

    );

}


// 解析界面语言:设置优先，auto 跟随系统(navigator.language)
t(key){

    const setting =
    (this.settings && this.settings.lang) || "auto";

    const lang =
    setting === "auto"
    ?
    (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en"
    :
    setting;

    return STRINGS[lang][key];

}



async handleFile(file){


    for(
        const rule of this.settings.rules
    ){


        const folder =
        (rule.folder || "")
        .replace(/\/+$/, "");


        // 只匹配文件夹本身或其子路径，避免 "Agenda" 误伤 "Agendafoo"
        if(
            !folder ||
            !(
                file.path === folder ||
                file.path.startsWith(folder + "/")
            )
        )
            continue;



        await this.addMeta(
            file,
            rule.properties
        );


    }


}






async addMeta(
    file,
    properties
){


    await this.app.fileManager.processFrontMatter(
        file,
        frontmatter=>{


            for(
                const [key,value]
                of Object.entries(properties)
            ){

                frontmatter[key]=value;

            }


        }
    );


}







async loadSettings(){

    this.settings =
    Object.assign(
        {},
        DEFAULT_SETTINGS,
        await this.loadData()
    );


}




async saveSettings(){

    await this.saveData(
        this.settings
    );

}


};








class MetaFlowSettingTab
extends PluginSettingTab {



constructor(app,plugin){

    super(app,plugin);

    this.plugin=plugin;

}



display(){


const {
    containerEl
}=this;


containerEl.empty();



// 界面语言(双语开关,auto 跟随系统)


new Setting(containerEl)

.setName(
this.plugin.t("langName")
)

.setDesc(
this.plugin.t("langDesc")
)

.addDropdown(
dropdown=>{


dropdown

.addOption(
"auto",
"Auto"
)

.addOption(
"zh",
"简体中文"
)

.addOption(
"en",
"English"
)

.setValue(
this.plugin.settings.lang || "auto"
)

.onChange(
async value=>{


this.plugin.settings.lang=value;


await this.plugin.saveSettings();


this.display();


}

);


}

);





// 顶部新增规则


new Setting(containerEl)

.addButton(
btn=>{


btn

.setButtonText(
this.plugin.t("addRule")
)


.onClick(
async()=>{


let rule={

folder:"",
properties:{}

};



this.plugin.settings.rules.push(
rule
);



await this.plugin.saveSettings();



this.createRule(
rule,
this.plugin.settings.rules.length-1,
containerEl
);



}

);


}

);






this.plugin.settings.rules
.forEach(
(rule,index)=>{


this.createRule(
rule,
index,
containerEl
);


}

);



}







createRule(
rule,
index,
container
){



const box =
container.createDiv();



// 内联样式统一走 setCssStyles(1.5+),避免直接 .style 赋值
box.setCssStyles({
    border:"1px solid var(--background-modifier-border)",
    borderRadius:"10px",
    padding:"10px",
    marginBottom:"12px"
});




// 标题栏


const header =
box.createDiv();



header.setCssStyles({
    cursor:"pointer",
    display:"flex",
    alignItems:"center"
});




const arrow =
header.createSpan(
{
text:"▼"
}
);



arrow.setCssStyles({
    marginRight:"8px"
});





const title =
header.createEl(
"b",
{
text:
rule.folder
?
`📁 ${rule.folder}`
:
this.plugin.t("newRule")
}
);





const content =
box.createDiv();



content.setCssStyles({
    marginTop:"10px"
});





let opened=true;



header.onclick=()=>{


opened=!opened;


content.style.display =
opened
?
"block"
:
"none";


arrow.textContent =
opened
?
"▼"
:
"▶";


};





// 文件夹选择


new Setting(content)

.setName(
this.plugin.t("watchedFolder")
)

.addDropdown(
dropdown=>{


dropdown.addOptions(
this.getFolders()
);



dropdown.setValue(
rule.folder
);



dropdown.onChange(
async value=>{


rule.folder=value;



title.textContent =
value
?
`📁 ${value}`
:
this.plugin.t("newRule");



await this.plugin.saveSettings();


}

);


}

);

// Properties区域


const propertyBox =
content.createDiv();




const renderProperties=()=>{


propertyBox.empty();



propertyBox.createEl(
"h3",
{
text:"Properties"
}
);



Object.entries(
rule.properties
)

.forEach(
([key,value])=>{


this.createProperty(
rule,
key,
value,
propertyBox,
renderProperties
);


}

);



};



renderProperties();






// 添加 Property


new Setting(content)

.addButton(
btn=>{


btn

.setButtonText(
this.plugin.t("addProperty")
)


.onClick(
async()=>{


rule.properties["new"]="";


await this.plugin.saveSettings();


renderProperties();


}

);


}

);







// 删除规则


new Setting(content)

.addButton(
btn=>{


btn

.setButtonText(
this.plugin.t("deleteRule")
)


.onClick(
async()=>{


const currentIndex =
this.plugin.settings.rules.indexOf(rule);


if(currentIndex === -1)
    return;


this.plugin.settings.rules.splice(
currentIndex,
1
);



await this.plugin.saveSettings();



box.remove();


}

);


}

);



}








createProperty(
rule,
key,
value,
container,
refresh
){



let row =
new Setting(container);



let keyInput;



// key 重命名点「保存」之前，value 始终写入当前 key，避免写进旧 key
let currentKey = key;




row.addText(
text=>{


keyInput=text;


text

.setValue(
key
)

.setPlaceholder(
"key"
);


}

);







row.addText(
text=>{


text

.setValue(
Array.isArray(value)
?
value.join(",")
:
String(value)
)


.setPlaceholder(
"value"
)


.onChange(
async val=>{


rule.properties[currentKey]=

val.includes(",")
?
val.split(",").map(s=>s.trim()).filter(s=>s!=="")
:
val;



await this.plugin.saveSettings();


}

);


}

);







// 保存 Key


row.addButton(
btn=>{


btn

.setButtonText(
this.plugin.t("save")
)


.onClick(
async()=>{


let newKey =
keyInput.getValue().trim();



if(
newKey &&
newKey!==currentKey
){


if(
rule.properties[newKey] !== undefined
){


new Notice(
this.plugin.t("keyExists")
);


return;


}


let old =
rule.properties[currentKey];


delete rule.properties[currentKey];


rule.properties[newKey]=old;


currentKey = newKey;



await this.plugin.saveSettings();



refresh();


}


}

);


}

);







// 删除 Property


row.addButton(
btn=>{


btn

.setButtonText(
this.plugin.t("delete")
)


.onClick(
async()=>{


delete rule.properties[key];


await this.plugin.saveSettings();



refresh();


}

);


}

);



}








getFolders(){


let folders={};



this.app.vault
.getAllLoadedFiles()
.forEach(
file=>{


if(file.children){

folders[file.path]=file.path;

}

}

);



return folders;


}


}
