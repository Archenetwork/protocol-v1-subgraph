// export const DT_FMT = {
//     default: "${YY}-${MM}-${DD} ${H}:${M}:${S}"      ,        // 2020-03-02 11:40:06
//     date_h : "${YY}-${MM}-${DD} ${H}"                ,        // 2020-03-02 11
//     full   : "${YY}-${MM}-${DD} ${H}:${M}:${S}.${MS}",        // 2020-03-02 11:40:06.008
// };

// export const HOUR_MS: number = 3600000; // 3600 * 1000;
// export const DAY_HOUR: number = 24;
// export const DAY_MS: number = 86400000; // DAY_HOUR * HOUR_MS;

// // fmt parameters: 
// //     ${YY} = full year            e.x: 2006
// //     ${yy} = short year           e.x: 06
// //     ${MM} = full month           e.x: 06
// //     ${mm} = short month          e.x: 6
// //     ${DD} = full day             e.x: 06
// //     ${dd} = short day            e.x: 6
// //     ${H}  = full hour            e.x: 06
// //     ${h}  = short hour           e.x: 6
// //     ${M}  = full minute          e.x: 06
// //     ${m}  = short minute         e.x: 6
// //     ${S}  = full seconds         e.x: 06
// //     ${s}  = short seconds        e.x: 6
// //     ${MS} = full millionseconds  e.x: 066
// //     ${ms} = short millionseconds e.x: 66
// export function formatDateTimeTS(timestamp_ms, fmt: string): string {
//     const tmp_date = new Date(timestamp_ms);
//     const rlt = formatDateTime(tmp_date, fmt);
//     return rlt;
// }
// export let fmtDT_TS = formatDateTimeTS;
// export function formatDateTime(date: Date, fmt: string): string {
//     const rlt: string = fmt.replace("${YY}", `${ date.getFullYear()                  }`)
//                            .replace("${yy}", `${ paddingNum(date.getFullYear() % 100, 2) }`)
//                            .replace("${MM}", `${ paddingNum(date.getMonth() + 1     , 2) }`)
//                            .replace("${mm}", `${ paddingNum(date.getMonth() + 1     , 1) }`)
//                            .replace("${DD}", `${ paddingNum(date.getDate()          , 2) }`)
//                            .replace("${dd}", `${ paddingNum(date.getDate()          , 1) }`)
//                            .replace("${H}" , `${ paddingNum(date.getHours()         , 2) }`)
//                            .replace("${h}" , `${ paddingNum(date.getHours()         , 1) }`)
//                            .replace("${M}" , `${ paddingNum(date.getMinutes()       , 2) }`)
//                            .replace("${m}" , `${ paddingNum(date.getMinutes()       , 1) }`)
//                            .replace("${S}" , `${ paddingNum(date.getSeconds()       , 2) }`)
//                            .replace("${s}" , `${ paddingNum(date.getSeconds()       , 1) }`)
//                            .replace("${MS}", `${ paddingNum(date.getMilliseconds()  , 3) }`)
//                            .replace("${ms}", `${ paddingNum(date.getMilliseconds()  , 1) }`);
//     return rlt;
// }

// export function paddingNum(num: number, width: number = 1, fill_char: string = "0", align_l: boolean = true): string {
//     let rlt: string = `${ num }`;
//     while (rlt.length < width && fill_char.length > 0) {
//         if (align_l) {
//             rlt     = fill_char + rlt;
//         } else {
//             rlt     = rlt + fill_char;
//         }
//     }
//     return rlt;
// }
