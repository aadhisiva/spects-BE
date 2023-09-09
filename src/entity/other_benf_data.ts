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

    @Column({ default: '' })
    benf_name: string;

    @Column({ default: '' })
    dob: string;

    @Column({default: ''})
    user_id: string;

    @Column({ default: '' })
    taluk: string;

    @Column('text', {default: ''})
    image: string;

    @Column({ default: '' })
    age: number;

    @Column({ default: '' })
    district: string;

    @Column({ default: '' })
    otp: string;

    @Column({ default: '' })
    phone_number: string;

    @Column({ default: '' })
    category: string;

    @Column({ default: '' })
    caste: string;

    @Column({ default: '' })
    order_number: string;

    @Column({ default: '' })
    gender: string;

    @Column({ default: '' })
    education_id: string;

    @Column({ default: '' })
    father_name: string;

    @Column({ default: '' })
    address: string;

    @Column({ default: '' })
    aadhar_no: string;

    @Column({ default: '' })
    rc_no: string;

    @Column({ default: '' })
    type: string;

    @Column({ default: '' })
    details: string;

    @Column({default: ''})
    scheme_eligability: string;

    @Column({default: ''})
    frame_type: string;

    @Column({default: ''})
    frame_size: string;

    @Column({default: ''})
    applicationStatus: string;

    @Column('text', { default: '' })
    initial_image: string;

    @Column({ default: '' })
    left_eye_sph_plus: string;

    @Column({ default: '' })
    left_eye_sph_minus: string;

    @Column({ default: '' })
    left_eye_cyl_plus: string;

    @Column({ default: '' })
    left_eye_cyl_minus: string;

    @Column({ default: '' })
    left_eye_axis: string;

    @Column({ default: '' })
    left_eye_va: string;

    @Column({ default: '' })
    right_eye_sph_plus: string;

    @Column({ default: '' })
    right_eye_sph_minus: string;

    @Column({ default: '' })
    right_eye_cyl_plus: string;

    @Column({ default: '' })
    right_eye_cyl_minus: string;

    @Column({ default: '' })
    right_eye_axis: string;

    @Column({ default: '' })
    right_eye_va: string;

    @Column({ default: '' })
    near_vision_sph: string;

    @Column({ default: '' })
    near_vision_cyl: string;

    @Column({ default: '' })
    near_vision_axis: string;

    @Column({ default: '' })
    near_vision_va: string;

    @Column({ default: '' })
    status: string;

    @Column({ default: "N" })
    ekyc_check: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
