const sleepN = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//INJECTING SETTINGS COG EVERYTIME AFTER CHECKING IF AUTHORIZED ID EXISTS AND IF ITS NOT SESSION INACTIVE PAGE
const injectSettingsCog = () => {
    //create element for cog button
    const cogElement = document.createElement('div');
    cogElement.classList.add('vtopPlusCog');
    cogElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#337ab7">
  <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
</svg>`
    //create modal element for settings
    const cogModal = document.createElement('div');
    cogModal.classList.add("vtopPlusModal-container")
    cogModal.innerHTML =
        `<div class="modal">
            
        </div>`
    const bodyElement = document.querySelector('body');
    bodyElement.append(cogElement);



};

if (document.querySelector("#authorizedID")) {
    injectSettingsCog()
}

//Triggers semester selection
const selectSemester = async ({submitType, semesterId})=>{
    let selectObj = document.querySelector("#semesterSubId");
    while (true) {
        if (!selectObj) {
            await sleepN(200);
            selectObj = document.querySelector("#semesterSubId");
        } else {
            break;
        }
    }
    selectObj.value = semesterId;
    if(submitType==='onchange') {
        selectObj.dispatchEvent(new Event('change'));
    } else if (submitType==='form') {
        const formId = selectObj.form.id;
        const script = document.createElement('script');
        script.textContent = `
        $("#${formId}").ready(()=>{
            document.querySelector("#${formId}").dispatchEvent(new Event('submit'));
        });
        `;
        (document.head||document.documentElement).appendChild(script);
        script.remove();
    }
};

//Inject Cumulative Marks
const injectCumulativeMarks = () => {
    const tableHeader = document.querySelector(".tableHeader");
    if (!tableHeader) {
        return
    }
    const cumulativeHeader = document.createElement("td");
    cumulativeHeader.textContent = "Cumulative Marks";
    tableHeader.append(cumulativeHeader);
    const outerRowElements = [...document.querySelectorAll(".tableContent:nth-child(even)")];
    const innerTableElements = [...document.querySelectorAll(".tableContent:nth-child(odd)")];
    if (outerRowElements.length===innerTableElements.length) {
        outerRowElements.forEach((outerRowElement, index) => {
            const innerTable = innerTableElements[index];
            innerTable.querySelector(`td[colspan]`).setAttribute("colspan", "10");
            const allComponents = [...innerTable.querySelectorAll(".tableContent-level1")];
            const cumRes = allComponents.reduce((res, component) => {
                const compValue = parseFloat(component.querySelector("td:nth-child(7)").textContent);
                const compTotal = parseInt(component.querySelector("td:nth-child(4)").textContent);
                return {
                    value: res.value+compValue,
                    total: res.total+compTotal
                }
            }, {value:0, total:0});
            const newTdElement = document.createElement("td");
            newTdElement.textContent = `${cumRes.value.toFixed(1)}/${cumRes.total}`;
            outerRowElement.append(newTdElement);
        });
    }
};

//Inject Course titles into the Timetable
const injectCourseTitlesToTT = () => {
    //get course details into an object
    const courseElementTexts = [...document.querySelectorAll("#studentDetailsList > div:nth-child(3) > table > tbody > tr > td:nth-child(3) > p:nth-child(1)")].map(ele=>ele.textContent);
    const courseCodeTitle = {};
    courseElementTexts.forEach(text => {
        const tmp = text.split(" - ");
        courseCodeTitle[tmp[0]] = tmp[1];
    });
    const allGreenSlots = document.querySelectorAll(`tr td[bgcolor="#CCFF33"]`);
    allGreenSlots.forEach(ele=>{
        const oldText = ele.textContent;
        const regexMatch = oldText.match(/(^\w+)-(\w+)-.*/);
        const slot = regexMatch[1];
        const courseCode = regexMatch[2];
        ele.textContent = `${slot}-${courseCodeTitle[courseCode]}`;
    });
};


//Action Reducer
if (document.querySelector(".VTopBody")) {
    chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => {
        switch (request.actionName) {
            case "checkInjection":
                sendResponse({actionResponse: {injected: true}})
                break;
            case "semesterSelection":
                await selectSemester(request.actionOptions);
                break;
            case "injectCumulativeMarks":
                injectCumulativeMarks();
                break;
            case "showCourseTitlesOnTimeTable":
                injectCourseTitlesToTT();
                break;
            default:
                throw new Error(`Invalid action: ${JSON.stringify(request)}`);
        }
    });
}
