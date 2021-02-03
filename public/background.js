const PageOptionsArray = [
    {pageName: "DA", submitType: 'onchange', pageUrl: "https://vtop.vit.ac.in/vtop/examinations/StudentDA"},
    {pageName: "coursePage", submitType: 'onchange', pageUrl: "https://vtop.vit.ac.in/vtop/academics/common/StudentCoursePage"},
    {pageName: "coursePageFromBack", submitType: 'onchange', pageUrl: "https://vtop.vit.ac.in/vtop/processbackToFilterCourse"},
    {pageName: "marks", submitType: 'onchange', pageUrl: "https://vtop.vit.ac.in/vtop/examinations/StudentMarkView"},
    {pageName: "timeTable", submitType: 'onchange', pageUrl: "https://vtop.vit.ac.in/vtop/academics/common/StudentTimeTable"},
    {pageName: "calendar", submitType: 'onchange', pageUrl: "https://vtop.vit.ac.in/vtop/academics/common/CalendarPreview"},
    {pageName: "examSchedule", submitType: 'form', pageUrl: "https://vtop.vit.ac.in/vtop/examinations/StudExamSchedule"},
    {pageName: "attendance", submitType: 'form', pageUrl: "https://vtop.vit.ac.in/vtop/academics/common/StudentAttendance"},
];



const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


chrome.webRequest.onCompleted.addListener( (details) => {

    if (/https:\/\/vtop\.vit\.ac\.in\/vtop\/((downloadSpotLightViewFile)|(assets)|(users\/image))/.test(details.url)) return;

    //Check if script is already injected and if not, inject the content script
    console.log(details.url)
    console.log("**Checking for previous injection")

    chrome.tabs.sendMessage(details.tabId, {actionName: "checkInjection"}, async (response)=>{

        if (chrome.runtime.lastError) await sleep(500);

        if (!chrome.runtime.lastError) {

            if (!response) {

                chrome.tabs.executeScript(null, { file: "content.js" });
                chrome.tabs.insertCSS(null, {file: "content.css"});

                console.log(">>Injected!!")
            } else {
                console.log(">>Already injected!")
            }
        }
    });


    //Trigger Semester selection if any of the sem selection pages appear
    const semSelectOptionsMatch = PageOptionsArray.find(option=>option.pageUrl===details.url);

    if (semSelectOptionsMatch) {
        chrome.tabs.sendMessage(details.tabId, {
            actionName: "semesterSelection",
            actionOptions: {...semSelectOptionsMatch, semesterId: 'VL20202105'}, //VL20202105 for winter sem, 01 for fall
        });
    }

    //Inject  cumulative marks into marks page
    if (details.url === "https://vtop.vit.ac.in/vtop/examinations/doStudentMarkView") {
        chrome.tabs.sendMessage(details.tabId, {
            actionName: "injectCumulativeMarks",
            actionOptions: {},
        });
    }

    //Inject Course title in to timetable page
    if (details.url === "https://vtop.vit.ac.in/vtop/processViewTimeTable") {
        chrome.tabs.sendMessage(details.tabId, {
            actionName: "showCourseTitlesOnTimeTable",
            actionOptions: {},
        });
    }




}, {urls: ["https://vtop.vit.ac.in/vtop/*"] });

