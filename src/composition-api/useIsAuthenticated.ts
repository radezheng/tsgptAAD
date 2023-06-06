import { Ref, ref, watch } from "vue";
import { useMsal } from "./useMsal";

export function useIsAuthenticated(): Ref<boolean> {
    const { accounts } = useMsal();
    const isAuthenticated = ref(accounts.value.length > 0);

    watch(accounts, () => {
        isAuthenticated.value = accounts.value.length > 0;
    });

    return isAuthenticated;
}

// export function useIsAdmin(): Ref<boolean> {
//     const { accounts } = useMsal();
//     const isAdmin = ref(false);

//     watch(accounts, () => {
//         if(accounts.value.length > 0) {
//             const user = accounts.value[0];
//             console.log("idTokenClaims->", user.idTokenClaims);
//             if(user.idTokenClaims && user.idTokenClaims.roles){
                
//                 isAdmin.value = user.idTokenClaims.roles?.includes("chat.admin");
//                 // console.log("isAdmin.value->", isAdmin.value);
//             }
//             else
//                 isAdmin.value = false;         
//         }else {
//             isAdmin.value = false;
//         }
//     });

//     return isAdmin;
// }