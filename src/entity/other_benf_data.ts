import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

export enum SchemeEligibility {
    YES = "Yes",
    NO = "No",
}

@Entity()
export class other_benf_data {
    constructor(data) {
        Object.assign(this, data);
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    benf_unique_id: string;

    @Column({ default: null })
    benf_name: string;

    @Column({ default: null })
    dob: string;

    @Column({default: null})
    user_id: string;

    @Column({ default: null })
    taluk: string;

    @Column('text', {default: null})
    image: string;

    @Column({ default: null })
    age: number;

    @Column({ default: null })
    district: string;

    @Column({ default: null })
    otp: string;

    @Column({ default: null })
    phone_number: string;

    @Column({ default: null })
    category: string;

    @Column({ default: null })
    caste: string;

    @Column({ default: null })
    order_number: string;

    @Column({ default: null })
    gender: string;

    @Column({ default: null })
    education_id: string;

    @Column({ default: null })
    father_name: string;

    @Column({ default: null })
    address: string;

    @Column({ default: null })
    aadhar_no: string;

    @Column({ default: null })
    rc_no: string;

    @Column({ default: null })
    type: string;

    @Column({ default: null })
    details: string;

    @Column({default: null})
    scheme_eligability: string;

    @Column({default: null})
    frame_type: string;

    @Column({default: null})
    frame_size: string;

    @Column('text', { default: null })
    initial_image: string;

    @Column({ default: null })
    left_eye_sph_plus: string;

    @Column({ default: null })
    left_eye_sph_minus: string;

    @Column({ default: null })
    left_eye_cyl_plus: string;

    @Column({ default: null })
    left_eye_cyl_minus: string;

    @Column({ default: null })
    left_eye_axis: string;

    @Column({ default: null })
    left_eye_va: string;

    @Column({ default: null })
    right_eye_sph_plus: string;

    @Column({ default: null })
    right_eye_sph_minus: string;

    @Column({ default: null })
    right_eye_cyl_plus: string;

    @Column({ default: null })
    right_eye_cyl_minus: string;

    @Column({ default: null })
    right_eye_axis: string;

    @Column({ default: null })
    right_eye_va: string;

    @Column({ default: null })
    near_vision_sph: string;

    @Column({ default: null })
    near_vision_cyl: string;

    @Column({ default: null })
    near_vision_axis: string;

    @Column({ default: null })
    near_vision_va: string;

    @Column({ default: null })
    status: string;

    @Column({ default: "N" })
    ekyc_check: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
