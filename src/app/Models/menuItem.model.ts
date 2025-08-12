type MenuItem = {
    id: number;
    menu_name: string;
    url_route: string;
    serial_no: number;
    icon: string;
    mapping_id: number;
    user_id: number;
    menu_id: number;
    status: number;
    has_sub_menu?: boolean
    parent_id?: number;
};

export default MenuItem;
